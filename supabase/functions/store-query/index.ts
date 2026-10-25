import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  if (req.method !== "POST") return json({ error: "Only POST is accepted." }, 405);

  try {
    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "admin_exists") {
      const { data, error } = await db.rpc("admin_exists");
      if (error) throw error;
      return json({ exists: data === true });
    }

    if (action === "check_discount") {
      const code = typeof body?.code === "string" ? body.code.trim().slice(0, 40) : "";
      if (!code) return json({ error: "Manjka koda za popust." }, 400);
      const { data, error } = await db.rpc("check_discount", { p_code: code.toUpperCase() });
      if (error) throw error;
      if (data === null) return json({ valid: false }, 200);
      return json({ valid: true, percent: Number(data) }, 200);
    }

    return json({ error: "Neznano dejanje." }, 400);
  } catch (err) {
    console.error("store-query error", err);
    return json({ error: "Napaka strežnika." }, 500);
  }
});
