import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function findUserIdByEmail(db: SupabaseClient, email: string): Promise<string | null> {
  const { data, error } = await db.rpc("admin_list_users");
  if (error) throw error;
  const match = (data as { id: string; email: string }[]).find((u) => u.email?.toLowerCase() === email);
  return match?.id ?? null;
}

async function grantAdmin(db: SupabaseClient, userId: string) {
  const { error } = await db.rpc("admin_add_admin", { p_user_id: userId });
  if (error) throw error;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user: caller }, error: cErr } = await userClient.auth.getUser();
    if (cErr || !caller) return json({ error: "Dostop zavrnjen." }, 403);

    const { data: isAdmin, error: aErr } = await userClient.rpc("is_admin");
    if (aErr || isAdmin !== true) return json({ error: "Dostop zavrnjen." }, 403);

    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const body = await req.json();
    const action = body?.action;

    if (action === "list_users") {
      const { data, error } = await db.rpc("admin_list_users");
      if (error) throw error;
      return json({ users: data });
    }

    if (action === "create_user") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password : "";
      const makeAdmin = Boolean(body?.is_admin);
      const firstName = typeof body?.first_name === "string" ? body.first_name.trim().slice(0, 80) : "";
      const lastName = typeof body?.last_name === "string" ? body.last_name.trim().slice(0, 80) : "";
      if (!email || !password) return json({ error: "Manjkajo podatki." }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Neveljaven e-poštni naslov." }, 400);
      if (password.length < 8) return json({ error: "Geslo mora imeti vsaj 8 znakov." }, 400);

      const { data: created, error: createErr } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      });

      if (createErr || !created?.user) {
        const msg = createErr?.message?.toLowerCase() ?? "";
        const code = (createErr as { code?: string } | null)?.code ?? "";
        console.error("createUser failed", createErr?.status, code, createErr?.message);
        if (code === "email_address_invalid" || msg.includes("invalid")) {
          return json({ error: "Neveljaven e-poštni naslov." }, 400);
        }
        if (code === "email_exists" || code === "user_already_exists" || msg.includes("already")) {
          if (!makeAdmin) return json({ error: "Uporabnik s tem e-poštnim naslovom že obstaja." }, 409);
          const existingId = await findUserIdByEmail(db, email);
          if (!existingId) return json({ error: "Uporabnik s tem e-poštnim naslovom že obstaja." }, 409);
          await grantAdmin(db, existingId);
          return json({ user: { id: existingId, email }, existing: true });
        }
        if (code === "weak_password" || msg.includes("password")) return json({ error: "Geslo je prešibko ali preveč znano. Izberite drugo, težje uganljivo geslo." }, 400);
        throw createErr ?? new Error("createUser returned no user");
      }

      const userId = created.user.id;
      const { error: pErr } = await db
        .from("profiles")
        .upsert({ id: userId, first_name: firstName, last_name: lastName }, { onConflict: "id" });
      if (pErr) console.error("profile upsert failed", pErr);

      if (makeAdmin) await grantAdmin(db, userId);
      return json({ user: { id: userId, email } });
    }

    if (action === "reset_password") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) return json({ error: "Manjkajo podatki." }, 400);
      const origin = req.headers.get("origin") ?? undefined;
      const { error } = await db.auth.resetPasswordForEmail(email, origin ? { redirectTo: origin } : undefined);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "add_admin") {
      const userId = body?.user_id;
      if (typeof userId !== "string" || !userId) return json({ error: "Manjkajo podatki." }, 400);
      await grantAdmin(db, userId);
      return json({ ok: true });
    }

    if (action === "remove_admin") {
      const userId = body?.user_id;
      if (typeof userId !== "string" || !userId) return json({ error: "Manjkajo podatki." }, 400);
      const { error } = await db.rpc("admin_remove_admin", { p_user_id: userId, p_caller_id: caller.id });
      if (error) {
        if (error.message.includes("Ne morete")) return json({ error: "Ne morete odstraniti lastnih skrbniških pravic." }, 400);
        throw error;
      }
      return json({ ok: true });
    }

    if (action === "generate_invoice") {
      const orderId = body?.order_id;
      if (typeof orderId !== "string" || !orderId) return json({ error: "Manjkajo podatki." }, 400);
      const { data, error } = await db.rpc("generate_invoice", { p_order_id: orderId });
      if (error) {
        if (error.message.includes("ni najdeno")) return json({ error: "Naročilo ni najdeno." }, 404);
        throw error;
      }
      return json({ invoice: Array.isArray(data) ? data[0] : data });
    }

    return json({ error: "Neznano dejanje." }, 400);
  } catch (err) {
    console.error("admin-manage error", err);
    return json({ error: "Napaka strežnika." }, 500);
  }
});
