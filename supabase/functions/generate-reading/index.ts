/**
 * Single Edge Function: turn raw FastAPI JSON into 2–4 câu tiếng Việt (Haiku) + DB cache.
 * Luôn HTTP 200 + { reading: string | null } — không 500.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Bạn là chuyên gia phong thủy & lịch số Việt Nam.

INPUT: JSON data từ 1 API endpoint. Field "endpoint" cho biết loại data.
OUTPUT: 2-4 câu diễn giải tự nhiên bằng tiếng Việt.

Quy tắc:
- Đọc data, hiểu context, viết như đang tư vấn trực tiếp cho khách.
- Giọng: ấm áp, rõ ràng, tự tin. Không hàn lâm, không xu nịnh.
- TUYỆT ĐỐI không bịa thêm thông tin ngoài data.
- TUYỆT ĐỐI không dùng emoji.
- Không lặp lại data dạng thô — diễn giải thành ý nghĩa.
- Nếu có yếu tố xấu, nói thẳng nhưng luôn kèm hướng giải quyết.
- Trả plain text, không markdown, không bullet points.`;

/** TTL ms — theo spec sản phẩm */
const TTL_MS: Record<string, number> = {
  "ngay-hom-nay": 24 * 60 * 60 * 1000,
  "chon-ngay": 24 * 60 * 60 * 1000,
  "day-detail": 24 * 60 * 60 * 1000,
  "phong-thuy": 7 * 24 * 60 * 60 * 1000,
  "tieu-van": 7 * 24 * 60 * 60 * 1000,
  "hop-tuoi": 7 * 24 * 60 * 60 * 1000,
  "tu-tru": 7 * 24 * 60 * 60 * 1000,
  "la-so": 7 * 24 * 60 * 60 * 1000,
};

const MAX_BODY_CHARS = 180_000;
/** Mặc định Haiku 4.5 — 3.5 Haiku dated có thể đã retire. Ghi đè: secret ANTHROPIC_MODEL */
const DEFAULT_LLM_MODEL = "claude-haiku-4-5";
const REQUEST_TIMEOUT_MS = 8_000;

function ok(reading: string | null): Response {
  return new Response(JSON.stringify({ reading }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  const parts = keys.map((k) => {
    const v = o[k];
    return `${JSON.stringify(k)}:${stableStringify(v === undefined ? null : v)}`;
  });
  return `{${parts.join(",")}}`;
}

async function sha256Prefix16(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}

function ttlForEndpoint(endpoint: string): number {
  return TTL_MS[endpoint] ?? 24 * 60 * 60 * 1000;
}

async function anthropicReading(userJson: string): Promise<string | null> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key?.trim()) {
    console.warn("generate-reading: ANTHROPIC_API_KEY missing");
    return null;
  }

  const model =
    Deno.env.get("ANTHROPIC_MODEL")?.trim() || DEFAULT_LLM_MODEL;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key.trim(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userJson,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn(
        "generate-reading: Anthropic HTTP",
        res.status,
        errBody.slice(0, 500),
      );
      return null;
    }
    const body = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = body.content?.find((c) => c.type === "text")?.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch (e) {
    console.warn("generate-reading: Anthropic fetch error", e);
    return null;
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return ok(null);
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return ok(null);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return ok(null);
  }

  const body = parsed as Record<string, unknown>;
  const endpoint =
    typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  const data = body.data;

  if (!endpoint || data === undefined) {
    return ok(null);
  }

  if (data !== null && typeof data !== "object") {
    return ok(null);
  }

  const dataJson = stableStringify(data);
  const cacheInput = `${endpoint}\n${dataJson}`;
  const cacheKey = await sha256Prefix16(cacheInput);

  const payload = stableStringify({ endpoint, data });
  if (payload.length > MAX_BODY_CHARS) {
    return ok(null);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const now = Date.now();

  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: row, error: readErr } = await admin
      .from("reading_cache")
      .select("reading, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (!readErr && row && typeof row.reading === "string") {
      const exp = row.expires_at as string;
      if (new Date(exp).getTime() > now) {
        return ok(row.reading);
      }
    }
  }

  const reading = await anthropicReading(payload);
  if (!reading) {
    return ok(null);
  }

  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey);
    const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
    // Không gửi created_at — INSERT dùng default DB; on conflict chỉ cập nhật reading + expires_at.
    await admin.from("reading_cache").upsert(
      {
        cache_key: cacheKey,
        reading,
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" },
    );
  }

  return ok(reading);
});
