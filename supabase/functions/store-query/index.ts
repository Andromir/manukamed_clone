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

async function requireUser(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return null;
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

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

    if (action === "check_admin") {
      const caller = await requireUser(req);
      if (!caller) return json({ error: "Dostop zavrnjen." }, 401);
      const { data, error } = await db.rpc("is_admin_user", { p_user_id: caller.id });
      if (error) throw error;
      return json({ admin: data === true });
    }

    if (action === "claim_first_admin") {
      const caller = await requireUser(req);
      if (!caller) return json({ error: "Dostop zavrnjen." }, 401);
      const { data, error } = await db.rpc("admin_exists");
      if (error) throw error;
      if (data !== true) {
        const { data: claimed, error: claimError } = await db.rpc("claim_first_admin_by_user", {
          p_user_id: caller.id,
          p_email: caller.email ?? "",
        });
        if (claimError) throw claimError;
        return json({ claimed: claimed === true });
      }
      const { data: isAdmin, error: adminError } = await db.rpc("is_admin_user", { p_user_id: caller.id });
      if (adminError) throw adminError;
      return json({ claimed: isAdmin === true });
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
