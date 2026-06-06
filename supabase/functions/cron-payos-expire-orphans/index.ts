/**
 * G3 — Expire pending PayOS orders past `expires_at` (5 min checkout window).
 * Schedule: `cron-payos-expire-pending` every minute (pg_cron).
 * Auth: Authorization: Bearer CRON_SECRET.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verifyCronAuth } from "../_shared/cron-auth.ts";
import { PAY_CHECKOUT_TIMEOUT_MS } from "../_shared/pay-checkout-timeout.ts";
import { corsHeaders } from "../_shared/cors.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
  const nowIso = new Date().toISOString();
  const legacyCreatedCutoff = new Date(
    Date.now() - PAY_CHECKOUT_TIMEOUT_MS,
  ).toISOString();

  const { data: byExpires, error: expErr } = await admin
    .from("payment_orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", nowIso)
    .select("id");

  if (expErr) {
    console.error("cron-payos-expire-orphans expires_at", expErr);
    return json({ error: { code: "DB_ERROR", message: expErr.message } }, 500);
  }

  const { data: legacy, error: legErr } = await admin
    .from("payment_orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .is("expires_at", null)
    .lt("created_at", legacyCreatedCutoff)
    .select("id");

  if (legErr) {
    console.error("cron-payos-expire-orphans legacy", legErr);
    return json({ error: { code: "DB_ERROR", message: legErr.message } }, 500);
  }

  const count = (byExpires?.length ?? 0) + (legacy?.length ?? 0);
  console.log(`cron-payos-expire-orphans: expired ${count} pending orders`);
  return json({ expired_count: count, cutoff: nowIso });
});
