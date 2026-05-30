/**
 * Unlock gate for inline/full day luận — subscription only (Direction C).
 * Idempotent per user + scope + day_iso via credit_ledger idempotency_key (historical rows only).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import { subscriptionActive } from "../_shared/subscription.ts";

const SINGLE_FEATURE_KEY = "ai_reading_unlock";
const BULK_FEATURE_KEY = "ai_reading_bulk_unlock";

/** Valid single-section scopes */
const SINGLE_SCOPES = ["home", "day_detail"] as const;
/** Bulk scope: unlocks all sections of la_so_chi_tiet at bundle price */
const BULK_SCOPE = "la_so_chi_tiet_bulk";

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersForRequest(req) });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error_code: "METHOD_NOT_ALLOWED" }, 405, req);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("reading-unlock: missing Supabase env");
    return json({ ok: false, error_code: "SERVER_CONFIG" }, 500, req);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error_code: "UNAUTHORIZED" }, 401, req);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json({ ok: false, error_code: "UNAUTHORIZED" }, 401, req);
  }

  let body: { scope?: unknown; day_iso?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(
      { ok: false, error_code: "BAD_REQUEST", message: "JSON không hợp lệ." },
      400,
      req,
    );
  }

  const scope = typeof body.scope === "string" ? body.scope.trim() : "";
  const isBulk = scope === BULK_SCOPE;
  const isSingle = (SINGLE_SCOPES as readonly string[]).includes(scope);

  if (!isSingle && !isBulk) {
    return json(
      {
        ok: false,
        error_code: "BAD_REQUEST",
        message: `scope phải là ${SINGLE_SCOPES.join(", ")} hoặc ${BULK_SCOPE}.`,
      },
      400,
      req,
    );
  }

  const FEATURE_KEY = isBulk ? BULK_FEATURE_KEY : SINGLE_FEATURE_KEY;

  const dayIso = typeof body.day_iso === "string" ? body.day_iso.trim() : "";
  if (!ISO_DAY.test(dayIso)) {
    return json(
      {
        ok: false,
        error_code: "BAD_REQUEST",
        message: "day_iso cần dạng YYYY-MM-DD.",
      },
      400,
      req,
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const idempotencyKey = isBulk
    ? `${BULK_FEATURE_KEY}:${user.id}:${dayIso}`
    : `${SINGLE_FEATURE_KEY}:${user.id}:${scope}:${dayIso}`;

  const { data: existing } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("user_id", user.id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return json(
      {
        ok: true,
        unlocked: true,
        charged: false,
        already_unlocked: true,
      },
      200,
      req,
    );
  }

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("subscription_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr || !profile) {
    return json(
      {
        ok: false,
        error_code: "PROFILE_MISSING",
        message: "Chưa có hồ sơ.",
      },
      400,
      req,
    );
  }

  if (subscriptionActive(profile.subscription_expires_at as string | null)) {
    await admin.from("credit_ledger").insert({
      user_id: user.id,
      delta: 0,
      balance_after: 0,
      reason: FEATURE_KEY,
      feature_key: FEATURE_KEY,
      idempotency_key: idempotencyKey,
      metadata: { scope, day_iso: dayIso, bulk: isBulk, subscription_free: true },
    });

    return json(
      {
        ok: true,
        unlocked: true,
        charged: false,
        already_unlocked: false,
        subscription_free: true,
      },
      200,
      req,
    );
  }

  return json(
    {
      ok: false,
      error_code: "SUB_EXPIRED",
      message: "Lịch đã hết hạn. Gia hạn để mở luận giải.",
      unlocked: false,
    },
    403,
    req,
  );
});
