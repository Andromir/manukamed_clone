import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const round = (n: number) => Math.round(n * 100) / 100;
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

interface Variant { size: string; price: number }
interface ItemIn { slug: string; size: string; qty: number; subscribe: boolean }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user: caller }, error: cErr } = await userClient.auth.getUser();
    if (cErr || !caller) return json({ error: "Dostop zavrnjen." }, 403);

    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin, error: aErr } = await db.rpc("is_admin_user", { p_user_id: caller.id });
    if (aErr || isAdmin !== true) return json({ error: "Dostop zavrnjen." }, 403);
    const body = await req.json();

    const c = body?.customer ?? {};
    const customer = {
      email: str(c.email, 160).toLowerCase(),
      first_name: str(c.first_name, 80),
      last_name: str(c.last_name, 80),
      phone: str(c.phone, 40),
      address: str(c.address, 160),
      address2: str(c.address2, 160),
      postal_code: str(c.postal_code, 20),
      city: str(c.city, 80),
      country: str(c.country, 60),
    };

    const userId = str(body?.user_id, 40);
    if (userId) {
      const { data: u, error: uErr } = await db.auth.admin.getUserById(userId);
      if (uErr || !u.user?.email) return json({ error: "Izbrana stranka ne obstaja." }, 400);
      customer.email = u.user.email.toLowerCase();
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return json({ error: "Neveljaven e-poštni naslov." }, 400);
    if (!customer.first_name || !customer.last_name || !customer.address || !customer.postal_code || !customer.city || !customer.phone) {
      return json({ error: "Izpolnite vsa obvezna polja." }, 400);
    }

    const rawItems: unknown = body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) return json({ error: "Košarica je prazna." }, 400);
    const items: ItemIn[] = rawItems.map((i) => ({
      slug: str(i?.slug, 120),
      size: str(i?.size, 80),
      qty: Math.floor(Number(i?.qty)),
      subscribe: Boolean(i?.subscribe),
    }));
    if (items.some((i) => !i.slug || !Number.isFinite(i.qty) || i.qty < 1 || i.qty > 99)) return json({ error: "Neveljavna košarica." }, 400);

    const { data: settings, error: sErr } = await db.from("store_settings").select("*").eq("id", true).maybeSingle();
    if (sErr || !settings) throw new Error("Nastavitve trgovine niso na voljo.");

    if (customer.country && Array.isArray(settings.countries) && !settings.countries.includes(customer.country)) {
      return json({ error: "Dostava v izbrano državo ni mogoča." }, 400);
    }

    const { data: products, error: pErr } = await db
      .from("products")
      .select("id, slug, name, images, variants, sale_price, stock, is_published")
      .in("slug", [...new Set(items.map((i) => i.slug))]);
    if (pErr) throw pErr;

    const subscribePct = Number(settings.subscribe_discount) / 100;
    const orderItems = [];
    for (const it of items) {
      const p = products?.find((x) => x.slug === it.slug);
      if (!p) return json({ error: `Izdelek ni najden: ${it.slug}` }, 400);
      const variants = (p.variants ?? []) as Variant[];
      const v = variants.find((x) => x.size === it.size) ?? variants[0];
      if (!v) return json({ error: `Izdelek ni na voljo: ${p.name}` }, 400);
      const base = p.sale_price != null ? Number(p.sale_price) : Number(v.price);
      const unit = it.subscribe ? round(base * (1 - subscribePct)) : base;
      orderItems.push({
        product_id: p.id,
        slug: p.slug,
        name: p.name,
        size: v.size,
        image: Array.isArray(p.images) ? p.images[0] ?? "" : "",
        qty: it.qty,
        unit_price: unit,
        total: round(unit * it.qty),
        subscribe: it.subscribe,
      });
    }

    const subtotal = round(orderItems.reduce((s, i) => s + i.total, 0));

    let discount = 0;
    let discountCode: string | null = null;
    const code = str(body?.discount_code, 40).toUpperCase();
    if (code) {
      const { data: pct, error } = await db.rpc("check_discount", { p_code: code });
      if (error) throw error;
      if (pct == null) return json({ error: "Koda za popust ni veljavna." }, 400);
      discount = round(subtotal * (Number(pct) / 100));
      discountCode = code;
    }

    const shipping = (settings.shipping_methods ?? []).find(
      (m: { id: string; enabled: boolean }) => m.id === body?.shipping_method && m.enabled,
    );
    if (!shipping) return json({ error: "Izberite način dostave." }, 400);
    const shippingCost = subtotal >= Number(settings.free_shipping_threshold) ? 0 : Number(shipping.price);

    const paymentMethod = str(body?.payment_method, 20);
    const pm = settings.payment_methods?.[paymentMethod];
    if (!pm?.enabled) return json({ error: "Izbrani način plačila ni na voljo." }, 400);
    const paymentFee = round(Number(pm.fee) || 0);

    const total = round(subtotal - discount + shippingCost + paymentFee);
    const paymentStatus = str(body?.payment_status, 20) || "unpaid";
    const orderStatus = str(body?.order_status, 20) || "new";
    const adminNote = str(body?.admin_note, 500);

    const { data: order, error: oErr } = await db.rpc("create_order", {
      p_order: {
        status: orderStatus,
        payment_method: paymentMethod,
        ...customer,
        shipping_method: shipping.id,
        shipping_label: shipping.label,
        shipping_cost: shippingCost,
        payment_fee: paymentFee,
        subtotal,
        discount,
        discount_code: discountCode,
        total,
        newsletter: Boolean(body?.newsletter),
        user_id: userId || null,
      },
      p_items: orderItems,
    });
    if (oErr) {
      const m = /OUT_OF_STOCK:(.*)/.exec(oErr.message);
      if (m) return json({ error: `Izdelka ni dovolj na zalogi: ${m[1]}` }, 409);
      throw oErr;
    }

    const updateFields: Record<string, unknown> = { payment_status: paymentStatus };
    if (adminNote) updateFields.admin_note = adminNote;
    await db.from("orders").update(updateFields).eq("id", order.id);

    return json({ order_number: order.order_number, order_id: order.id });
  } catch (err) {
    console.error(err);
    return json({ error: "Naročila ni bilo mogoče ustvariti. Poskusite znova." }, 500);
  }
});
