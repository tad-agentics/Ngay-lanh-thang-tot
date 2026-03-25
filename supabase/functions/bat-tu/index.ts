import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Anonymous-friendly ops (tech-spec §10). */
const ANONYMOUS_OPS = new Set([
  "ngay-hom-nay",
  "weekly-summary",
  "convert-date",
  "lich-thang",
]);

const VALID_OPS = new Set([
  "ngay-hom-nay",
  "weekly-summary",
  "chon-ngay",
  "chon-ngay/detail",
  "lich-thang",
  "day-detail",
  "convert-date",
  "tu-tru",
  "profile",
  "tieu-van",
  "hop-tuoi",
  "phong-thuy",
  "share",
]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function resolveFeatureKey(
  op: string,
  body: Record<string, unknown>,
): string | null {
  switch (op) {
    case "ngay-hom-nay":
      return "ngay_hom_nay";
    case "weekly-summary":
      return "weekly_summary";
    case "convert-date":
      return "convert_date";
    case "lich-thang":
      return "lich_thang_overview";
    case "chon-ngay": {
      const w = Number(body.windowDays ?? body.days ?? body.range ?? 30);
      if (!Number.isFinite(w) || w <= 30) return "chon_ngay_30";
      if (w <= 60) return "chon_ngay_60";
      return "chon_ngay_90";
    }
    case "chon-ngay/detail":
      return "chon_ngay_detail";
    case "day-detail":
      return "day_detail";
    case "tu-tru":
      return "tu_tru";
    case "tieu-van":
      return "tieu_van";
    case "hop-tuoi":
      return "hop_tuoi";
    case "phong-thuy":
      return "phong_thuy";
    case "share":
      return "share_card";
    default:
      return null;
  }
}

function subscriptionActive(expires: string | null): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}

type SupabaseAdmin = ReturnType<typeof createClient>;

async function refundCredits(
  admin: SupabaseAdmin,
  userId: string,
  featureKey: string,
  charged: number,
  op: string,
): Promise<void> {
  if (charged <= 0) return;
  const { data: profile } = await admin
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return;
  const bal = profile.credits_balance as number;
  const newBal = bal + charged;
  await admin
    .from("profiles")
    .update({ credits_balance: newBal })
    .eq("id", userId);
  await admin.from("credit_ledger").insert({
    user_id: userId,
    delta: charged,
    balance_after: newBal,
    reason: "bat_tu_refund",
    feature_key: featureKey,
    metadata: { op, note: "upstream_failure" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "POST only" } }, 405);
  }

  const batUrl = Deno.env.get("BAT_TU_API_URL");
  const batKey = Deno.env.get("BAT_TU_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!batUrl || !batKey) {
    return json(
      {
        error: {
          code: "SERVER_CONFIG",
          message: "Bát Tự API not configured.",
        },
      },
      503,
    );
  }
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(
      {
        error: { code: "SERVER_CONFIG", message: "Supabase not configured." },
      },
      500,
    );
  }

  let payload: { op?: string; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, 400);
  }

  const op = payload.op;
  const body =
    payload.body && typeof payload.body === "object" && !Array.isArray(payload.body)
      ? (payload.body as Record<string, unknown>)
      : {};

  if (!op || typeof op !== "string" || !VALID_OPS.has(op)) {
    return json(
      {
        error: {
          code: "INVALID_OP",
          message: `Unknown or unsupported op: ${String(op)}`,
        },
      },
      422,
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);
  let userId: string | null = null;

  if (!ANONYMOUS_OPS.has(op)) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Đăng nhập để dùng tính năng này.",
          },
        },
        401,
      );
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const u = userData?.user;
    if (userErr || !u) {
      return json(
        { error: { code: "UNAUTHORIZED", message: "Phiên không hợp lệ." } },
        401,
      );
    }
    userId = u.id;
  }

  const featureKey = resolveFeatureKey(op, body);
  let chargedAmount = 0;

  if (featureKey && userId) {
    const { data: costRow } = await admin
      .from("feature_credit_costs")
      .select("credit_cost, is_free")
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (
      costRow && !costRow.is_free && (costRow.credit_cost as number) > 0
    ) {
      const cost = costRow.credit_cost as number;
      const { data: profile, error: pErr } = await admin
        .from("profiles")
        .select("credits_balance, subscription_expires_at")
        .eq("id", userId)
        .maybeSingle();

      if (pErr || !profile) {
        return json(
          {
            error: {
              code: "PROFILE_MISSING",
              message: "Chưa có hồ sơ. Đăng xuất và đăng nhập lại.",
            },
          },
          400,
        );
      }

      if (!subscriptionActive(profile.subscription_expires_at as string | null)) {
        const bal = profile.credits_balance as number;
        if (bal < cost) {
          return json(
            {
              error: {
                code: "INSUFFICIENT_CREDITS",
                message: "Không đủ lượng để dùng tính năng này.",
              },
            },
            402,
          );
        }

        const newBal = bal - cost;
        const { error: uErr } = await admin
          .from("profiles")
          .update({ credits_balance: newBal })
          .eq("id", userId);

        if (uErr) {
          console.error("bat-tu deduct", uErr);
          return json(
            { error: { code: "DB_ERROR", message: "Không trừ lượng được." } },
            500,
          );
        }

        const { error: lErr } = await admin.from("credit_ledger").insert({
          user_id: userId,
          delta: -cost,
          balance_after: newBal,
          reason: "bat_tu",
          feature_key: featureKey,
          metadata: { op },
        });

        if (lErr) {
          console.error("bat-tu ledger", lErr);
          await admin
            .from("profiles")
            .update({ credits_balance: bal })
            .eq("id", userId);
          return json(
            { error: { code: "DB_ERROR", message: "Ghi sổ lượng thất bại." } },
            500,
          );
        }

        chargedAmount = cost;
      }
    }
  }

  const upstreamUrl = batUrl.replace(/\/$/, "");
  let upstreamRes: Response;

  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": batKey,
      },
      body: JSON.stringify({ op, body }),
    });
  } catch (e) {
    console.error("bat-tu fetch", e);
    if (userId && featureKey) {
      await refundCredits(admin, userId, featureKey, chargedAmount, op);
    }
    return json(
      {
        error: {
          code: "BAT_TU_UPSTREAM",
          message: "Không kết nối được máy chủ Bát Tự.",
        },
      },
      502,
    );
  }

  const rawText = await upstreamRes.text();

  if (!upstreamRes.ok) {
    console.error("bat-tu upstream", upstreamRes.status, rawText);
    if (userId && featureKey) {
      await refundCredits(admin, userId, featureKey, chargedAmount, op);
    }
    return json(
      {
        error: {
          code: "BAT_TU_ERROR",
          message: rawText.slice(0, 500) || "Bát Tự từ chối yêu cầu.",
        },
      },
      502,
    );
  }

  let data: unknown;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  return json({ data });
});
