/**
 * G3 — Expire stale pending PayOS orders (daily cron).
 * Schedule: 0 17 * * * UTC (~00:00 ICT next day) or via Dashboard Cron.
 * Auth: Authorization: Bearer CRON_SECRET (same as cron-push-habit).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function verifyCronAuth(req: Request): boolean {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return true;
  const h = req.headers.get("Authorization");
  const token = h?.startsWith("Bearer ") ? h.slice(7).trim() : null;
  return token === secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: { code: "METHOD_NOT_ALLOWED" } }, 405);
  }

  if (!verifyCronAuth(req)) {
    return json({ error: { code: "UNAUTHORIZED", message: "Invalid cron token" } }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("cron-payos-expire-orphans: missing env");
    return json({ error: { code: "SERVER_CONFIG" } }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("payment_orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("cron-payos-expire-orphans", error);
    return json({ error: { code: "DB_ERROR", message: error.message } }, 500);
  }

  const count = data?.length ?? 0;
  console.log(`cron-payos-expire-orphans: expired ${count} pending orders`);
  return json({ expired_count: count, cutoff });
});
