/**
 * Ops health check — verify PayOS Edge secrets are set (no secret values exposed).
 * Invoke: GET/POST with Authorization: Bearer CRON_SECRET
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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

  if (!verifyCronAuth(req)) {
    return json({ error: { code: "UNAUTHORIZED" } }, 401);
  }

  const flags = {
    PAYOS_CLIENT_ID: Boolean(Deno.env.get("PAYOS_CLIENT_ID")),
    PAYOS_API_KEY: Boolean(Deno.env.get("PAYOS_API_KEY")),
    PAYOS_CHECKSUM_KEY: Boolean(Deno.env.get("PAYOS_CHECKSUM_KEY")),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
    SUPABASE_URL: Boolean(Deno.env.get("SUPABASE_URL")),
  };

  const payosReady =
    flags.PAYOS_CLIENT_ID &&
    flags.PAYOS_API_KEY &&
    flags.PAYOS_CHECKSUM_KEY;
  const checkoutReady = payosReady && flags.SUPABASE_SERVICE_ROLE_KEY;
  const webhookReady = payosReady && flags.SUPABASE_SERVICE_ROLE_KEY;

  return json({
    payos_checkout_ready: checkoutReady,
    payos_webhook_ready: webhookReady,
    secrets: flags,
    notes: [
      "Register payos-webhook URL in PayOS merchant dashboard.",
      "Deploy payos-create-checkout and payos-webhook after setting secrets.",
    ],
  });
});
