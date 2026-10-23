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

const str = (v: unknown, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Only POST is accepted." }, 405);
  }

  try {
    const secret = Deno.env.get("BRANDSPOT_PUBLISH_SECRET");
    if (!secret) {
      console.error("BRANDSPOT_PUBLISH_SECRET is not configured.");
      return json({ error: "Server is not configured for publishing." }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token || token !== secret) {
      return json({ error: "Unauthorized." }, 401);
    }

    const body = await req.json();
    const productId = str(body?.product_id, 200);
    const revision = Number(body?.revision);

    if (!productId) {
      return json({ error: "product_id is required." }, 400);
    }
    if (!Number.isFinite(revision) || revision < 0) {
      return json({ error: "revision must be a non-negative number." }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Check existing revision — ignore stale updates
    const { data: existing, error: fetchErr } = await db
      .from("products")
      .select("id, revision")
      .eq("slug", productId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing && existing.revision != null && existing.revision >= revision) {
      await db.from("publish_log").insert({
        product_id: productId,
        revision,
        status: "stale",
        message: `Ignored: stored revision ${existing.revision} >= incoming ${revision}`,
      });
      return json({ status: "stale", message: "A newer or equal revision already exists." }, 200);
    }

    // Build the update payload from the allowed fields only
    const update: Record<string, unknown> = {
      revision,
      updated_at: new Date().toISOString(),
    };

    // title → name
    if (body?.title != null) update.name = str(body.title, 300);

    // description
    if (body?.description != null) update.description = str(body.description, 5000);

    // stock
    if (body?.stock != null) {
      const stock = Math.max(0, Math.floor(Number(body.stock)));
      if (Number.isFinite(stock)) update.stock = stock;
    }

    // price → stored as sale_price (numeric)
    if (body?.price != null) {
      const price = Number(body.price);
      if (Number.isFinite(price) && price >= 0) update.sale_price = price;
    }

    // delivery_date (ISO date string)
    if (body?.delivery_date != null) {
      const d = str(body.delivery_date, 30);
      if (d) {
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) {
          update.delivery_date = parsed.toISOString().slice(0, 10);
        }
      }
    }

    // specs (jsonb)
    if (body?.specs != null) {
      update.specs = body.specs;
    }

    // images (jsonb array)
    if (body?.images != null) {
      if (Array.isArray(body.images)) {
        update.images = body.images.filter((i) => typeof i === "string").slice(0, 20);
      }
    }

    let status: "applied" | "error" = "applied";
    let message: string | null = null;

    if (existing) {
      const { error: upErr } = await db
        .from("products")
        .update(update)
        .eq("slug", productId);

      if (upErr) {
        status = "error";
        message = upErr.message;
        throw upErr;
      }
    } else {
      // Insert new row with required fields defaulted
      const insertPayload: Record<string, unknown> = {
        slug: productId,
        name: str(body?.title, 300) || productId,
        category: "dodatki",
        ...update,
      };
      const { error: inErr } = await db.from("products").insert(insertPayload);
      if (inErr) {
        status = "error";
        message = inErr.message;
        throw inErr;
      }
    }

    await db.from("publish_log").insert({
      product_id: productId,
      revision,
      status,
      message,
    });

    return json({ status: "applied", product_id: productId, revision }, 200);
  } catch (err) {
    console.error("brandspot-publish error:", err);
    return json({ error: "Publish failed." }, 500);
  }
});
