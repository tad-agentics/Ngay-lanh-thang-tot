/**
 * Create a shareable link token: validates JWT, deducts `share_card` credits (unless subscribed),
 * inserts `share_tokens` via service role (server-trusted deduction).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FEATURE_KEY = "share_card";

const PAYLOAD_STRING_KEYS = [
  "headline",
  "summary",
  "event_label",
  "date_label",
  "lunar_label",
  "grade",
  "menh",
  "reason_short",
  "preview_image_path",
] as const;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function subscriptionActive(expires: string | null): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}

function sanitizePayload(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const o = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of PAYLOAD_STRING_KEYS) {
    const v = o[k];
    if (typeof v === "string" && v.length <= 4000) {
      out[k] = v.slice(0, 2000);
    }
  }
  return out;
}

function isValidResultType(s: string): boolean {
  return /^[\w-]{1,48}$/.test(s);
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "POST only" } },
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(
      {
        error: {
          code: "SERVER_CONFIG",
          message: "Supabase not configured.",
        },
      },
      500,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Đăng nhập để tạo liên kết." } },
      401,
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Phiên không hợp lệ." } },
      401,
    );
  }

  let bodyIn: { result_type?: unknown; payload?: unknown };
  try {
    bodyIn = await req.json();
  } catch {
    return json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, 400);
  }

  const resultType =
    typeof bodyIn.result_type === "string" ? bodyIn.result_type.trim() : "";
  if (!isValidResultType(resultType)) {
    return json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "result_type không hợp lệ.",
        },
      },
      400,
    );
  }

  const payload = sanitizePayload(bodyIn.payload);
  const headline = typeof payload.headline === "string" ? payload.headline.trim() : "";
  if (!headline) {
    return json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "payload.headline là bắt buộc.",
        },
      },
      400,
    );
  }
  payload.headline = headline;

  const admin = createClient(supabaseUrl, serviceKey);
  let chargedAmount = 0;
  let previousBalance = 0;

  const { data: costRow } = await admin
    .from("feature_credit_costs")
    .select("credit_cost, is_free")
    .eq("feature_key", FEATURE_KEY)
    .maybeSingle();

  if (costRow && !costRow.is_free && (costRow.credit_cost as number) > 0) {
    const cost = costRow.credit_cost as number;
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("credits_balance, subscription_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr || !profile) {
      return json(
        {
          error: {
            code: "PROFILE_MISSING",
            message: "Chưa có hồ sơ.",
          },
        },
        400,
      );
    }

    if (!subscriptionActive(profile.subscription_expires_at as string | null)) {
      previousBalance = profile.credits_balance as number;
      if (previousBalance < cost) {
        return json(
          {
            error: {
              code: "INSUFFICIENT_CREDITS",
              message: "Không đủ lượng để tạo thẻ chia sẻ.",
            },
          },
          402,
        );
      }

      const newBal = previousBalance - cost;
      const { error: uErr } = await admin
        .from("profiles")
        .update({ credits_balance: newBal })
        .eq("id", user.id);

      if (uErr) {
        console.error("create-share-token deduct", uErr);
        return json(
          { error: { code: "DB_ERROR", message: "Không trừ lượng được." } },
          500,
        );
      }

      const { error: lErr } = await admin.from("credit_ledger").insert({
        user_id: user.id,
        delta: -cost,
        balance_after: newBal,
        reason: "share_token",
        feature_key: FEATURE_KEY,
        metadata: { result_type: resultType },
      });

      if (lErr) {
        console.error("create-share-token ledger", lErr);
        await admin
          .from("profiles")
          .update({ credits_balance: previousBalance })
          .eq("id", user.id);
        return json(
          { error: { code: "DB_ERROR", message: "Ghi sổ lượng thất bại." } },
          500,
        );
      }

      chargedAmount = cost;
    }
  }

  const token = randomToken();
  const expiresAt = new Date(Date.now() + 90 * 864e5 * 1000).toISOString();

  const { error: insErr } = await admin.from("share_tokens").insert({
    token,
    user_id: user.id,
    result_type: resultType,
    payload,
    expires_at: expiresAt,
  });

  if (insErr) {
    console.error("create-share-token insert", insErr);
    if (chargedAmount > 0) {
      const { data: p2 } = await admin
        .from("profiles")
        .select("credits_balance")
        .eq("id", user.id)
        .maybeSingle();
      const bal = (p2?.credits_balance as number) ?? 0;
      const refund = bal + chargedAmount;
      await admin
        .from("profiles")
        .update({ credits_balance: refund })
        .eq("id", user.id);
      await admin.from("credit_ledger").insert({
        user_id: user.id,
        delta: chargedAmount,
        balance_after: refund,
        reason: "share_token_refund",
        feature_key: FEATURE_KEY,
        metadata: { note: "insert_failed" },
      });
    }
    return json(
      { error: { code: "DB_ERROR", message: "Không tạo liên kết được." } },
      500,
    );
  }

  return json({
    data: {
      token,
      expires_at: expiresAt,
    },
  });
});
