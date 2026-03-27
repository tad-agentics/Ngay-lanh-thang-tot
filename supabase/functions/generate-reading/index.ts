/**
 * Single Edge Function: turn raw FastAPI JSON into tiếng Việt (Haiku) + DB cache.
 * `la-so-chi-tiet`: một lần gọi → JSON nhiều khía cạnh (đoạn văn), còn lại: plain reading.
 * Luôn HTTP 200 — không 500.
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
OUTPUT: 2-4 câu luận giải tự nhiên bằng tiếng Việt.

Quy tắc:
- Đọc data, hiểu context, viết như đang tư vấn trực tiếp cho khách.
- Giọng: ấm áp, rõ ràng, tự tin. Không hàn lâm, không xu nịnh.
- TUYỆT ĐỐI không bịa thêm thông tin ngoài data.
- TUYỆT ĐỐI không dùng emoji.
- Không lặp lại data dạng thô — luận giải thành ý nghĩa.
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
  "la-so-chi-tiet": 7 * 24 * 60 * 60 * 1000,
};

const MAX_BODY_CHARS = 180_000;
/** Mặc định Haiku 4.5 — 3.5 Haiku dated có thể đã retire. Ghi đè: secret ANTHROPIC_MODEL */
const DEFAULT_LLM_MODEL = "claude-haiku-4-5";
const REQUEST_TIMEOUT_MS = 8_000;
const LA_SO_CHI_TIET_TIMEOUT_MS = 28_000;

type LaSoChiTietSection = { id: string; title: string; text: string };

const LA_SO_FALLBACK_SECTION_ID = "tong_hop";
const LA_SO_FALLBACK_TITLE = "Luận giải";

const LA_SO_ASPECT_ORDER = [
  "tinh_cach",
  "su_nghiep",
  "tai_van",
  "suc_khoe",
  "tinh_duyen",
] as const;

const LA_SO_ASPECT_TITLES: Record<string, string> = {
  tinh_cach: "Tính cách",
  su_nghiep: "Sự nghiệp",
  tai_van: "Tài vận",
  suc_khoe: "Sức khỏe",
  tinh_duyen: "Tình duyên",
};

const LA_SO_KEY_ALIAS: Record<string, string> = {
  tinhCach: "tinh_cach",
  suNghiep: "su_nghiep",
  taiVan: "tai_van",
  sucKhoe: "suc_khoe",
  tinhDuyen: "tinh_duyen",
};

const LA_SO_CHI_TIET_SYSTEM = `Bạn là chuyên gia phong thủy & lịch số Việt Nam.

INPUT: field "endpoint" là "la-so-chi-tiet", field "data" là JSON lá số chi tiết (có thể có tinh_cach, su_nghiep, tai_van, suc_khoe, tinh_duyen, v.v.).

OUTPUT: CHỈ một JSON object hợp lệ, không markdown, không tiêu đề, không bọc \`\`\`, không thêm lời giải thích ngoài JSON.

Quy tắc:
- Mỗi key trong JSON là một trong: tinh_cach, su_nghiep, tai_van, suc_khoe, tinh_duyen — CHỈ thêm key khi INPUT có dữ liệu nguồn tương ứng cho khía cạnh đó (có thể đọc sâu trong lớp data/result/payload nếu có).
- Giá trị mỗi key: một chuỗi tiếng Việt gồm 2–4 câu, mạch lạc như đoạn văn; TUYỆT đối không dùng gạch đầu dòng, bullet, ký tự "-", "*", số thứ tự đầu dòng.
- Giọng: ấm áp, rõ ràng. Không emoji. Không bịa ngoài data.
- Nếu một khía cạnh hoàn toàn không có nguồn trong INPUT, không có key đó.`;

function ok(
  reading: string | null,
  sections?: LaSoChiTietSection[] | null,
): Response {
  const body: Record<string, unknown> = { reading: reading ?? null };
  if (sections != null && sections.length > 0) body.sections = sections;
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function stripCodeFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
  return m ? m[1].trim() : t;
}

/** Parse JSON object; chịu preamble / text thừa quanh JSON (model đôi khi không tuân sát). */
function tryParseLaSoChiTietRecord(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const attempts = [stripCodeFence(trimmed), trimmed];
  for (const chunk of attempts) {
    try {
      const o = JSON.parse(chunk);
      if (o && typeof o === "object" && !Array.isArray(o)) {
        return o as Record<string, unknown>;
      }
    } catch {
      /* thử cách khác */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const o = JSON.parse(trimmed.slice(start, end + 1));
      if (o && typeof o === "object" && !Array.isArray(o)) {
        return o as Record<string, unknown>;
      }
    } catch {
      /* fail */
    }
  }
  return null;
}

function parseLaSoChiTietSections(text: string): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(text);
  if (!record) return null;
  const byId = new Map<string, string>();

  for (const key of Object.keys(record)) {
    const canon = LA_SO_KEY_ALIAS[key] ??
      (LA_SO_ASPECT_ORDER.includes(key as (typeof LA_SO_ASPECT_ORDER)[number])
        ? key
        : null);
    if (!canon) continue;
    const v = record[key];
    if (typeof v !== "string") continue;
    const t = v.trim().replace(/^\s*[-*•]\s+/gm, "").trim();
    if (!t) continue;
    byId.set(canon, t);
  }

  const out: LaSoChiTietSection[] = [];
  for (const id of LA_SO_ASPECT_ORDER) {
    const t = byId.get(id);
    if (!t) continue;
    out.push({
      id,
      title: LA_SO_ASPECT_TITLES[id] ?? id,
      text: t,
    });
  }
  return out.length > 0 ? out : null;
}

function readCachedBody(
  endpoint: string,
  reading: string,
): { reading: string | null; sections: LaSoChiTietSection[] | null } {
  if (endpoint === "la-so-chi-tiet") {
    try {
      const o = JSON.parse(reading) as { sections?: unknown };
      if (Array.isArray(o.sections) && o.sections.length > 0) {
        const sections: LaSoChiTietSection[] = [];
        for (const row of o.sections) {
          if (!row || typeof row !== "object" || Array.isArray(row)) continue;
          const r = row as Record<string, unknown>;
          const id = typeof r.id === "string" ? r.id : "";
          const title = typeof r.title === "string" ? r.title : "";
          const text = typeof r.text === "string" ? r.text.trim() : "";
          if (!id || !text) continue;
          sections.push({
            id,
            title: title || (LA_SO_ASPECT_TITLES[id] ?? id),
            text,
          });
        }
        if (sections.length > 0) return { reading: null, sections };
      }
    } catch {
      /* fall through */
    }
    return { reading: null, sections: null };
  }
  return { reading, sections: null };
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

async function anthropicCompletion(
  system: string,
  userJson: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<string | null> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key?.trim()) {
    console.warn("generate-reading: ANTHROPIC_API_KEY missing");
    return null;
  }

  const model =
    Deno.env.get("ANTHROPIC_MODEL")?.trim() || DEFAULT_LLM_MODEL;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
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
        max_tokens: maxTokens,
        system,
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

async function anthropicReading(userJson: string): Promise<string | null> {
  return await anthropicCompletion(
    SYSTEM_PROMPT,
    userJson,
    512,
    REQUEST_TIMEOUT_MS,
  );
}

async function anthropicLaSoChiTiet(userJson: string): Promise<string | null> {
  return await anthropicCompletion(
    LA_SO_CHI_TIET_SYSTEM,
    userJson,
    2048,
    LA_SO_CHI_TIET_TIMEOUT_MS,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return ok(null, null);
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return ok(null, null);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return ok(null, null);
  }

  const body = parsed as Record<string, unknown>;
  const endpoint =
    typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  const data = body.data;

  if (!endpoint || data === undefined) {
    return ok(null, null);
  }

  if (data !== null && typeof data !== "object") {
    return ok(null, null);
  }

  const dataJson = stableStringify(data);
  const cacheInput = `${endpoint}\n${dataJson}`;
  const cacheKey = await sha256Prefix16(cacheInput);

  const payload = stableStringify({ endpoint, data });
  if (payload.length > MAX_BODY_CHARS) {
    return ok(null, null);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const now = Date.now();
  const admin =
    supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

  if (admin) {
    const { data: row, error: readErr } = await admin
      .from("reading_cache")
      .select("reading, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (!readErr && row && typeof row.reading === "string") {
      const exp = row.expires_at as string;
      if (new Date(exp).getTime() > now) {
        const cached = readCachedBody(endpoint, row.reading);
        if (endpoint === "la-so-chi-tiet") {
          if (cached.sections != null && cached.sections.length > 0) {
            return ok(null, cached.sections);
          }
          await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
        } else {
          const r = cached.reading?.trim() ?? "";
          if (r.length > 0) return ok(r, null);
          await admin.from("reading_cache").delete().eq("cache_key", cacheKey);
        }
      }
    }
  }

  if (endpoint === "la-so-chi-tiet") {
    const raw = await anthropicLaSoChiTiet(payload);
    if (!raw) return ok(null, null);
    let sections = parseLaSoChiTietSections(raw);
    if (!sections?.length) {
      console.warn(
        "generate-reading: la-so-chi-tiet empty/parse — fallback plain reading",
        raw.slice(0, 240),
      );
      const plain = await anthropicReading(payload);
      const t = plain?.trim() ?? "";
      if (!t) {
        console.warn(
          "generate-reading: la-so-chi-tiet fallback plain failed",
          raw.slice(0, 400),
        );
        return ok(null, null);
      }
      sections = [
        {
          id: LA_SO_FALLBACK_SECTION_ID,
          title: LA_SO_FALLBACK_TITLE,
          text: t,
        },
      ];
    }
    const toStore = JSON.stringify({ sections });
    if (admin) {
      const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
      await admin.from("reading_cache").upsert(
        {
          cache_key: cacheKey,
          reading: toStore,
          expires_at: expiresAt,
        },
        { onConflict: "cache_key" },
      );
    }
    return ok(null, sections);
  }

  const reading = await anthropicReading(payload);
  if (!reading) {
    return ok(null, null);
  }

  if (admin) {
    const expiresAt = new Date(now + ttlForEndpoint(endpoint)).toISOString();
    await admin.from("reading_cache").upsert(
      {
        cache_key: cacheKey,
        reading,
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" },
    );
  }

  return ok(reading, null);
});
