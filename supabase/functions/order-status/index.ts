import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function confirmStripe(secret: string, sessionId: string, expectedRef: string | null) {
  if (!sessionId || sessionId !== expectedRef) return false;
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const s = await res.json();
  return res.ok && s?.payment_status === "paid";
}

async function confirmPaypal(mode: string, clientId: string, secret: string, ref: string) {
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const token = (await tokenRes.json())?.access_token;
  if (!token) return false;
  const res = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(ref)}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (res.ok && data?.status === "COMPLETED") return true;
  if (data?.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED") return true;
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const orderNumber = typeof body?.order_number === "string" ? body.order_number.slice(0, 40) : "";
    const token = typeof body?.token === "string" ? body.token : "";
    if (!orderNumber || !UUID.test(token)) return json({ error: "Naročilo ni najdeno." }, 404);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order, error } = await db
      .from("orders")
      .select("id, order_number, email, status, payment_method, payment_status, payment_ref, total, created_at")
      .eq("order_number", orderNumber)
      .eq("access_token", token)
      .maybeSingle();
    if (error) throw error;
    if (!order) return json({ error: "Naročilo ni najdeno." }, 404);

    let { status, payment_status } = order;
    const online = order.payment_method === "stripe" || order.payment_method === "paypal";
    if (online && payment_status === "unpaid" && status === "pending_payment" && order.payment_ref) {
      const { data: creds } = await db.from("payment_credentials").select("mode, public_key, secret_key").eq("provider", order.payment_method).maybeSingle();
      if (creds?.secret_key) {
        const paid = order.payment_method === "stripe"
          ? await confirmStripe(creds.secret_key, String(body?.session_id ?? ""), order.payment_ref)
          : await confirmPaypal(creds.mode, creds.public_key, creds.secret_key, order.payment_ref);
        if (paid) {
          await db.from("orders").update({ status: "new", payment_status: "paid" }).eq("id", order.id);
          status = "new";
          payment_status = "paid";
        }
      }
    }

    let bank = null;
    if (order.payment_method === "bank") {
      const { data: s } = await db.from("store_settings").select("bank_details").eq("id", true).maybeSingle();
      bank = s?.bank_details ?? null;
    }

    return json({
      order_number: order.order_number,
      email: order.email,
      total: Number(order.total),
      status,
      payment_method: order.payment_method,
      payment_status,
      bank_details: bank,
    });
  } catch (err) {
    console.error(err);
    return json({ error: "Stanja naročila ni bilo mogoče preveriti." }, 500);
  }
});
