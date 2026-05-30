/**
 * Create a shareable link token: validates JWT, requires active subscription,
 * inserts `share_tokens` via service role.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import { subscriptionActive } from "../_shared/subscription.ts";

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
  // AR-06: reading_only share type
  "reading_text",
  "scope",
  "section_label",
] as const;

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
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
    return new Response("ok", { headers: corsHeadersForRequest(req) });
  }

  if (req.method !== "POST") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "POST only" } }, 405, req);
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
      }, 500, req);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Đăng nhập để tạo liên kết." } }, 401, req);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Phiên không hợp lệ." } }, 401, req);
  }

  let bodyIn: { result_type?: unknown; payload?: unknown };
  try {
    bodyIn = await req.json();
  } catch {
    return json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, 400, req);
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
      req,
    );
  }

  const payload = sanitizePayload(bodyIn.payload);
  const isReadingOnly = resultType === "reading_only";

  const headline = typeof payload.headline === "string" ? payload.headline.trim() : "";
  if (!headline && !isReadingOnly) {
    return json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "payload.headline là bắt buộc.",
        },
      }, 400, req);
  }
  if (headline) payload.headline = headline;
  if (isReadingOnly && !payload.reading_text) {
    return json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "payload.reading_text là bắt buộc cho reading_only.",
        },
      }, 400, req);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("subscription_expires_at")
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
      req,
    );
  }

  if (!subscriptionActive(profile.subscription_expires_at as string | null)) {
    return json(
      {
        error: {
          code: "SUB_EXPIRED",
          message: "Gia hạn lịch để tạo thẻ chia sẻ.",
        },
      },
      402,
      req,
    );
  }

  const token = randomToken();
  const expiresAt = new Date(Date.now() + 90 * 864e5).toISOString();

  const { error: insErr } = await admin.from("share_tokens").insert({
    token,
    user_id: user.id,
    result_type: resultType,
    payload,
    expires_at: expiresAt,
  });

  if (insErr) {
    console.error("create-share-token insert", insErr);
    return json(
      { error: { code: "DB_ERROR", message: "Không tạo liên kết được." } },
      500,
      req,
    );
  }

  return json({
    data: {
      token,
      expires_at: expiresAt,
    },
  }, 200, req);
});
