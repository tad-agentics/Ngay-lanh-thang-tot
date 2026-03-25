/**
 * Public JSON resolve for a share token (read via service role).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PUBLIC_PAYLOAD_KEYS = [
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

function publicPayload(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const o = raw as Record<string, unknown>;
  for (const k of PUBLIC_PAYLOAD_KEYS) {
    const v = o[k];
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "GET only" } },
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
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

  const url = new URL(req.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  if (!token || token.length > 64 || !/^[a-f0-9]+$/i.test(token)) {
    return json(
      { error: { code: "BAD_REQUEST", message: "Token không hợp lệ." } },
      400,
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: row, error } = await admin
    .from("share_tokens")
    .select("result_type, payload, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("share-resolve", error);
    return json(
      { error: { code: "DB_ERROR", message: "Không đọc được liên kết." } },
      500,
    );
  }

  if (!row) {
    return json(
      { error: { code: "NOT_FOUND", message: "Liên kết không tồn tại." } },
      404,
    );
  }

  const exp = row.expires_at as string | null;
  if (exp && new Date(exp) < new Date()) {
    return json(
      { error: { code: "GONE", message: "Liên kết đã hết hạn." } },
      410,
    );
  }

  return json({
    data: {
      result_type: row.result_type as string,
      payload: publicPayload(row.payload),
      expires_at: exp,
    },
  });
});
