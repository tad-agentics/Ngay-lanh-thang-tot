/**
 * Trừ lượng (hoặc ghi nhận đã mở khóa) cho luận giải AI — Home / chi tiết ngày.
 * Idempotent theo user + scope + day_iso (credit_ledger.idempotency_key).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { subscriptionActive } from "../_shared/subscription.ts";

const FEATURE_KEY = "ai_reading_unlock";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error_code: "METHOD_NOT_ALLOWED" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("reading-unlock: missing Supabase env");
    return json({ ok: false, error_code: "SERVER_CONFIG" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error_code: "UNAUTHORIZED" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json({ ok: false, error_code: "UNAUTHORIZED" }, 401);
  }

  let body: { scope?: unknown; day_iso?: unknown; dry_run?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error_code: "BAD_REQUEST", message: "JSON không hợp lệ." }, 400);
  }

  const dryRun = body.dry_run === true;

  const scope = typeof body.scope === "string" ? body.scope.trim() : "";
  if (scope !== "home" && scope !== "day_detail") {
    return json(
      {
        ok: false,
        error_code: "BAD_REQUEST",
        message: "scope phải là home hoặc day_detail.",
      },
      400,
    );
  }

  const dayIso = typeof body.day_iso === "string" ? body.day_iso.trim() : "";
  if (!ISO_DAY.test(dayIso)) {
    return json(
      {
        ok: false,
        error_code: "BAD_REQUEST",
        message: "day_iso cần dạng YYYY-MM-DD.",
      },
      400,
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const idempotencyKey = `ai_reading_unlock:${user.id}:${scope}:${dayIso}`;

  const { data: existing } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("user_id", user.id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    const { data: profile } = await admin
      .from("profiles")
      .select("credits_balance")
      .eq("id", user.id)
      .maybeSingle();
    return json({
      ok: true,
      unlocked: true,
      credits_balance: (profile?.credits_balance as number) ?? 0,
      charged: false,
      already_unlocked: true,
      dry_run: dryRun,
    });
  }

  const { data: costRow } = await admin
    .from("feature_credit_costs")
    .select("credit_cost, is_free")
    .eq("feature_key", FEATURE_KEY)
    .maybeSingle();

  const cost =
    costRow && !costRow.is_free && (costRow.credit_cost as number) > 0
      ? (costRow.credit_cost as number)
      : 0;

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("credits_balance, subscription_expires_at")
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
    );
  }

  if (subscriptionActive(profile.subscription_expires_at as string | null)) {
    return json({
      ok: true,
      unlocked: true,
      credits_balance: profile.credits_balance as number,
      charged: false,
      already_unlocked: false,
      subscription_free: true,
      dry_run: dryRun,
    });
  }

  if (cost <= 0) {
    return json({
      ok: true,
      unlocked: true,
      credits_balance: profile.credits_balance as number,
      charged: false,
      already_unlocked: false,
      dry_run: dryRun,
    });
  }

  if (dryRun) {
    return json({
      ok: true,
      unlocked: false,
      credits_balance: profile.credits_balance as number,
      charged: false,
      already_unlocked: false,
      dry_run: true,
    });
  }

  const { data: deductResult, error: deductErr } = await admin.rpc(
    "deduct_credits_atomic",
    {
      p_user_id: user.id,
      p_cost: cost,
      p_reason: "ai_reading_unlock",
      p_feature_key: FEATURE_KEY,
      p_idempotency_key: idempotencyKey,
      p_metadata: { scope, day_iso: dayIso },
    },
  );

  if (deductErr) {
    console.error("reading-unlock deduct_credits_atomic", deductErr);
    return json(
      { ok: false, error_code: "DB_ERROR", message: "Không trừ lượng được." },
      500,
    );
  }

  const result = deductResult as { ok: boolean; error_code?: string; credits_balance: number };

  if (!result.ok) {
    if (result.error_code === "INSUFFICIENT_CREDITS") {
      return json(
        {
          ok: false,
          error_code: "INSUFFICIENT_CREDITS",
          message: "Không đủ lượng để mở khóa luận giải.",
          credits_balance: result.credits_balance,
          unlocked: false,
        },
        402,
      );
    }
    return json(
      { ok: false, error_code: result.error_code ?? "DB_ERROR", message: "Không trừ lượng được." },
      500,
    );
  }

  return json({
    ok: true,
    unlocked: true,
    credits_balance: result.credits_balance,
    charged: true,
    already_unlocked: false,
  });
});
