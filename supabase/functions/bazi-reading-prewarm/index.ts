/**
 * Pre-generate Luận Bát Tự sau unlock (PayOS webhook / nền).
 * Chỉ nhận `Authorization: Bearer` service role.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { runBaziReadingPrewarm } from "../_shared/bazi-reading-prewarm/run.ts";
import { currentYearVn } from "../_shared/bazi-reading-prewarm/profile-bat-tu.ts";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import {
  isServiceRoleBearer,
  prewarmUserIdFromBody,
} from "../_shared/internal-service-auth.ts";

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersForRequest(req) });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error_code: "METHOD_NOT_ALLOWED" }, 405, req);
  }

  if (!isServiceRoleBearer(req)) {
    return json({ ok: false, error_code: "FORBIDDEN" }, 403, req);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error_code: "SERVER_CONFIG" }, 500, req);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error_code: "BAD_REQUEST" }, 400, req);
  }

  const userId =
    prewarmUserIdFromBody(body) ??
    (typeof body.user_id === "string" ? body.user_id.trim() : "");
  if (!userId) {
    return json({ ok: false, error_code: "BAD_REQUEST" }, 400, req);
  }

  const flowYear =
    typeof body.flow_year === "number"
      ? body.flow_year
      : Number(body.flow_year) || currentYearVn();

  const admin = createClient(supabaseUrl, serviceKey);

  const run = () =>
    runBaziReadingPrewarm(admin, userId, flowYear).catch((e) => {
      console.error("[bazi-prewarm] unhandled", e);
    });

  // @ts-expect-error EdgeRuntime.waitUntil
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    // @ts-expect-error EdgeRuntime.waitUntil
    EdgeRuntime.waitUntil(run());
  } else {
    void run();
  }

  return json({ ok: true, started: true }, 202, req);
});
