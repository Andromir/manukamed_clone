import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PROVIDERS = ["stripe", "paypal"] as const;
type Provider = (typeof PROVIDERS)[number];

const mask = (s: string | null) => (s ? `${s.slice(0, 7)}…${s.slice(-4)}` : "");

async function testProvider(provider: Provider, mode: string, publicKey: string, secret: string): Promise<string | null> {
  if (provider === "stripe") {
    const res = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${secret}` } });
    if (!res.ok) return "Stripe je zavrnil skrivni ključ.";
    const live = secret.startsWith("sk_live_") || secret.startsWith("rk_live_");
    if ((mode === "live") !== live) return "Način (test/live) se ne ujema s ključem.";
    return null;
  }
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${publicKey}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  return res.ok ? null : "PayPal je zavrnil Client ID ali Secret.";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: isAdmin, error: aErr } = await userClient.rpc("is_admin");
    if (aErr || isAdmin !== true) return json({ error: "Dostop zavrnjen." }, 403);

    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const action = body?.action;

    if (action === "status") {
      const { data, error } = await db.from("payment_credentials").select("provider, mode, public_key, secret_key, verified_at");
      if (error) throw error;
      const out: Record<string, unknown> = {};
      for (const p of PROVIDERS) {
        const row = data?.find((r) => r.provider === p);
        out[p] = row
          ? { configured: Boolean(row.secret_key), mode: row.mode, public_key: row.public_key ?? "", secret_masked: mask(row.secret_key), verified_at: row.verified_at }
          : { configured: false, mode: "test", public_key: "", secret_masked: "", verified_at: null };
      }
      return json(out);
    }

    const provider = body?.provider as Provider;
    if (!PROVIDERS.includes(provider)) return json({ error: "Neznan ponudnik." }, 400);

    if (action === "save") {
      const mode = body?.mode === "live" ? "live" : "test";
      const publicKey = typeof body?.public_key === "string" ? body.public_key.trim().slice(0, 300) : "";
      const secret = typeof body?.secret_key === "string" ? body.secret_key.trim().slice(0, 300) : "";
      const { data: existing } = await db.from("payment_credentials").select("secret_key").eq("provider", provider).maybeSingle();
      const secretKey = secret || existing?.secret_key || "";
      if (!secretKey) return json({ error: "Vnesite skrivni ključ." }, 400);
      if (provider === "paypal" && !publicKey) return json({ error: "Vnesite PayPal Client ID." }, 400);
      if (provider === "stripe" && !/^(sk|rk)_(test|live)_/.test(secretKey)) return json({ error: "Stripe skrivni ključ se mora začeti s sk_test_ ali sk_live_." }, 400);

      const testError = await testProvider(provider, mode, publicKey, secretKey);
      const { error } = await db.from("payment_credentials").upsert({
        provider,
        mode,
        public_key: publicKey,
        secret_key: secretKey,
        verified_at: testError ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      if (testError) {
        const { data: s } = await db.from("store_settings").select("payment_methods").eq("id", true).maybeSingle();
        if (s?.payment_methods?.[provider]?.enabled) {
          s.payment_methods[provider].enabled = false;
          await db.from("store_settings").update({ payment_methods: s.payment_methods }).eq("id", true);
        }
        return json({ ok: false, error: testError });
      }
      return json({ ok: true });
    }

    if (action === "test") {
      const { data: row } = await db.from("payment_credentials").select("mode, public_key, secret_key").eq("provider", provider).maybeSingle();
      if (!row?.secret_key) return json({ ok: false, error: "Podatki za povezavo niso shranjeni." });
      const testError = await testProvider(provider, row.mode, row.public_key ?? "", row.secret_key);
      await db.from("payment_credentials").update({ verified_at: testError ? null : new Date().toISOString() }).eq("provider", provider);
      return json(testError ? { ok: false, error: testError } : { ok: true });
    }

    return json({ error: "Neznano dejanje." }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: "Napaka strežnika." }, 500);
  }
});
