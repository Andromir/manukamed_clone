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

const jwtRole = (token: string) => {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part)).role as string | undefined;
  } catch {
    return undefined;
  }
};

interface Variant { size: string; price: number }
interface ItemIn { slug: string; size: string; qty: number; subscribe: boolean }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let account: { id: string; email: string } | null = null;
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (jwtRole(jwt) === "authenticated") {
      const { data, error } = await createClient(url, anonKey).auth.getUser(jwt);
      if (error || !data.user?.email) return json({ error: "Vaša prijava je potekla. Prosimo, prijavite se znova." }, 401);
      account = { id: data.user.id, email: data.user.email.toLowerCase() };
    }

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
    if (account) customer.email = account.email;
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
      const p = products?.find((x) => x.slug === it.slug && x.is_published);
      if (!p) return json({ error: `Izdelek ni več na voljo: ${it.slug}` }, 400);
      const variants = (p.variants ?? []) as Variant[];
      const v = variants.find((x) => x.size === it.size) ?? variants[0];
      if (!v) return json({ error: `Izdelek ni več na voljo: ${p.name}` }, 400);
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
    const isOnline = paymentMethod === "stripe" || paymentMethod === "paypal";

    let creds: { mode: string; public_key: string; secret_key: string } | null = null;
    if (isOnline) {
      const { data } = await db.from("payment_credentials").select("mode, public_key, secret_key, verified_at").eq("provider", paymentMethod).maybeSingle();
      if (!data?.secret_key || !data.verified_at) return json({ error: "Spletno plačilo trenutno ni na voljo." }, 400);
      creds = data;
    }

    const { data: order, error: oErr } = await db.rpc("create_order", {
      p_order: {
        status: isOnline ? "pending_payment" : "new",
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
        user_id: account?.id ?? null,
      },
      p_items: orderItems,
    });
    if (oErr) {
      const m = /OUT_OF_STOCK:(.*)/.exec(oErr.message);
      if (m) return json({ error: `Izdelka ni dovolj na zalogi: ${m[1]}` }, 409);
      throw oErr;
    }

    const result = { order_number: order.order_number, token: order.access_token, total };
    if (!isOnline || !creds) return json(result);

    let origin: string;
    try {
      origin = new URL(str(body?.origin, 300)).origin;
    } catch {
      return json({ error: "Neveljaven naslov strani." }, 400);
    }
    const back = `${origin}/hvala?o=${encodeURIComponent(order.order_number)}&t=${order.access_token}&provider=${paymentMethod}`;
    const cancel = `${origin}/blagajna?preklicano=1`;

    if (paymentMethod === "stripe") {
      const form = new URLSearchParams({
        mode: "payment",
        success_url: `${back}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel,
        customer_email: customer.email,
        client_reference_id: order.order_number,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][unit_amount]": String(Math.round(total * 100)),
        "line_items[0][price_data][product_data][name]": `Naročilo ${order.order_number}`,
      });
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.secret_key}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      const session = await res.json();
      if (!res.ok || !session?.url) {
        await db.from("orders").update({ status: "cancelled", payment_status: "failed" }).eq("id", order.id);
        return json({ error: "Plačila s kartico trenutno ni mogoče začeti." }, 502);
      }
      await db.from("orders").update({ payment_ref: session.id }).eq("id", order.id);
      return json({ ...result, redirect_url: session.url });
    }

    const ppBase = creds.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    const tokenRes = await fetch(`${ppBase}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${creds.public_key}:${creds.secret_key}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.access_token) {
      await db.from("orders").update({ status: "cancelled", payment_status: "failed" }).eq("id", order.id);
      return json({ error: "Plačila s PayPal trenutno ni mogoče začeti." }, 502);
    }
    const ppRes = await fetch(`${ppBase}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenJson.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ reference_id: order.order_number, amount: { currency_code: "EUR", value: total.toFixed(2) } }],
        application_context: { return_url: back, cancel_url: cancel, shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
      }),
    });
    const ppOrder = await ppRes.json();
    const approve = ppOrder?.links?.find((l: { rel: string }) => l.rel === "approve" || l.rel === "payer-action")?.href;
    if (!ppRes.ok || !approve) {
      await db.from("orders").update({ status: "cancelled", payment_status: "failed" }).eq("id", order.id);
      return json({ error: "Plačila s PayPal trenutno ni mogoče začeti." }, 502);
    }
    await db.from("orders").update({ payment_ref: ppOrder.id }).eq("id", order.id);
    return json({ ...result, redirect_url: approve });
  } catch (err) {
    console.error(err);
    return json({ error: "Naročila ni bilo mogoče oddati. Poskusite znova." }, 500);
  }
});
