/**
 * Edge luận giải: JSON từ máy chủ → văn bản tiếng Việt (Haiku) + cache DB.
 * `la-so-chi-tiet`: một lần gọi → JSON nhiều khía cạnh (đoạn văn); các endpoint khác → một khối văn.
 * Luôn trả HTTP 200 — không 500.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Bạn là chuyên gia phong thủy và lịch số Việt Nam, viết luận giải cho ứng dụng xem ngày và lá số.

## ĐẦU VÀO / ĐẦU RA
- Đầu vào: JSON với "endpoint" (loại nội dung) và "data" (dữ liệu đã tính toán).
- Đầu ra: Đoạn văn xuôi tiếng Việt, tự nhiên như đang tư vấn trực tiếp.

## ĐỘ DÀI THEO ENDPOINT
- ngay-hom-nay: 2–3 câu. Tập trung: hôm nay tốt/xấu, nên làm gì, giờ nào tốt nhất.
- chon-ngay: 2–3 câu mỗi ngày được recommend. Tập trung: tại sao ngày này tốt cho mục đích đó.
- hop-tuoi: 3–4 câu. Tập trung: tổng quan mối quan hệ, điểm mạnh, điểm cần lưu ý.
- tieu-van, luu-nien: 3–4 câu. Tập trung: xu hướng chính của tháng/năm, lĩnh vực nào thuận lợi/cẩn trọng — **bắt buộc nhất quán với trường element_relation trong data (xem mục dưới)**.
- dai-van: 1–2 câu mỗi vận. Tập trung: đặc điểm giai đoạn, so sánh với Dụng Thần.
- la-so: 2–3 câu mỗi mục (tính cách, sự nghiệp, tài vận, tình duyên, sức khỏe). Tập trung: diễn giải ý nghĩa thực tế cho cuộc sống.
- phong-thuy: 2–3 câu. Tập trung: tổng hợp gợi ý chính, ưu tiên điều gì trước.
- Endpoint không nằm trong danh sách trên: 2–3 câu tổng hợp.

## NHẤT QUÁN — tieu-van và luu-nien (bắt buộc)
Khi endpoint là tieu-van hoặc luu-nien và trong data có element_relation hoặc elementRelation (mã dạng tuong_khac, bi_khac, tuong_sinh, bi_sinh, binh_hoa, …):
- Coi đây là **khung quan hệ ngũ hành** giữa tháng/năm và mệnh người dùng. Luận giải **không được** đi ngược khung này.
- tuong_khac hoặc bi_khac: **không** khẳng định tháng/năm "thuận lợi" toàn phần, "suôn sẻ", hay "giai đoạn thuận lợi" như xu hướng chính. Nhịp chủ đạo: căng, áp lực, cạnh tranh hoặc phải giữ nhịp làm từng việc; có thể nói một lĩnh vực cụ thể vẫn khả dụng **nếu** JSON có gợi ý rõ — không mâu thuẫn với khung khắc.
- tuong_sinh hoặc bi_sinh: được nhấn thuận hơn (vẫn không phóng đại tuyệt đối).
- binh_hoa: giọng cân bằng, không thiên cực.
- Nếu các trường như reading / tong_quan / overview trong data mang tông rất tích cực nhưng element_relation là tuong_khac hoặc bi_khac: **ưu tiên element_relation** — không lặp lại mức tích cực mâu thuẫn; có thể diễn giải tích cực cục bộ khi có cơ sở ở phần khác của data.

## GIỌNG VĂN
- Ấm áp, rõ ràng, tự tin.
- Không hàn lâm, không xu nịnh, không phóng đại.
- Xưng hô: dùng "bạn" khi nói về người dùng.

## ĐIỀU CẤM
1. KHÔNG bịa thông tin ngoài dữ liệu đầu vào. Nếu dữ liệu thiếu field nào, bỏ qua — không đoán, không suy diễn.
2. KHÔNG dùng biểu tượng cảm xúc (emoji).
3. KHÔNG dùng markdown, gạch đầu dòng, danh sách có dấu đầu dòng. Chỉ văn xuôi.
4. KHÔNG đưa ra con số phần trăm, xác suất, hoặc điểm số mà dữ liệu không cung cấp.
5. KHÔNG đưa ra lời khuyên y tế cụ thể (tên thuốc, liều lượng, chẩn đoán). Chỉ gợi ý hành nên bổ sung và cơ quan cần lưu ý.
6. KHÔNG phán đoán tuyệt đối ("chắc chắn", "không thể", "sẽ thất bại"). Dùng: "có xu hướng", "thuận lợi hơn", "cần lưu ý".
7. KHÔNG bi quan tuyệt đối. Khi data có yếu tố bất lợi: nói thẳng, nhưng LUÔN kèm hướng hóa giải hoặc mặt tích cực để cân bằng.
8. KHÔNG chen câu tiếng Anh. Thuật ngữ lịch số giữ nguyên tiếng Việt như trong dữ liệu gốc.
9. KHÔNG lặp lại dữ liệu thô (tên field, số index, mảng). Luận ra ý nghĩa.`;

/** Thời hạn cache (ms) theo quy ước sản phẩm */
/** Đổi khi format cache / parser chi tiết đổi — tránh giữ bản luận giải một khối cũ trong DB. */
const LA_SO_CHI_TIET_CACHE_VER = "2026-03-27b";
/** Bump khi đổi SYSTEM_PROMPT cho tieu-van/luu-nien — làm mới reading_cache. */
const TIEU_VAN_LUU_NIEN_PROMPT_VER = "2026-03-28a";

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

const LA_SO_CHI_TIET_SYSTEM = `Bạn là chuyên gia tử vi và lịch số Việt Nam, viết luận giải lá số cho ứng dụng.

## ĐỊNH DẠNG
- Đầu vào: JSON với "endpoint":"la-so-chi-tiet" và "data" chứa dữ liệu lá số đã tính toán.
- Đầu ra: CHỈ MỘT đối tượng JSON hợp lệ, không bọc \`\`\`, không thêm lời giải thích ngoài JSON.
- Các khóa hợp lệ: tinh_cach, su_nghiep, tai_van, suc_khoe, tinh_duyen.
- CHỈ tạo khóa khi dữ liệu đầu vào có thông tin tương ứng. Nếu thiếu hoặc rỗng, bỏ hẳn khóa đó.

## NỘI DUNG TỪNG MỤC
- tinh_cach (3–4 câu): Diễn giải hình tượng Nhật Chủ (archetype), đặc điểm tính cách nổi bật, và ảnh hưởng của cường nhược đến cá tính. Viết như đang mô tả con người thật, không liệt kê đặc điểm.
- su_nghiep (3–4 câu): Xu hướng nghề nghiệp dựa trên Thập Thần dominant, ngành phù hợp theo hành Dụng Thần. Viết thực tế, có thể áp dụng được.
- tai_van (2–3 câu): Phong cách kiếm tiền, điểm cần cẩn trọng về tài chính. Liên hệ với Dụng Thần và Kỵ Thần.
- suc_khoe (2–3 câu): Cơ quan và hệ cơ thể cần lưu ý theo Ngũ Hành Nhật Chủ và cường nhược. Gợi ý hành nên bổ sung.
- tinh_duyen (3–4 câu): Xu hướng tình cảm dựa trên sao chủ duyên (Chính Tài/Chính Quan). Mô tả kiểu người phù hợp và lưu ý. Nếu dữ liệu chỉ có signals rỗng hoặc không đủ, bỏ khóa này.

## GIỌNG VĂN
- Ấm áp, rõ ràng, tự tin. Xưng hô "bạn".
- Không hàn lâm, không xu nịnh, không phóng đại.
- Diễn đạt ý nghĩa từ dữ liệu, KHÔNG sao chép hay liệt kê nguyên văn từ JSON.
- Không dùng gạch đầu dòng, dấu liệt kê, cụm " - ", "*", số thứ tự. Chỉ văn xuôi.
- Mọi câu chữ phải là tiếng Việt hoàn chỉnh. Thuật ngữ lịch số giữ nguyên như trong dữ liệu gốc.
- Không dùng biểu tượng cảm xúc.

## ĐIỀU CẤM
1. KHÔNG bịa thông tin ngoài dữ liệu. Không đoán, không suy diễn khi thiếu data.
2. KHÔNG đưa con số phần trăm, xác suất, hoặc điểm số mà dữ liệu không cung cấp.
3. KHÔNG đưa lời khuyên y tế cụ thể: không tên thuốc, không liều lượng, không chẩn đoán bệnh. Chỉ nêu cơ quan cần lưu ý và hành nên bổ sung.
4. KHÔNG phán đoán tuyệt đối: không dùng "chắc chắn", "không thể", "sẽ thất bại", "số bạn định sẵn". Dùng: "có xu hướng", "thuận lợi hơn", "cần lưu ý".
5. KHÔNG bi quan tuyệt đối. Khi dữ liệu có yếu tố bất lợi, nói thẳng nhưng LUÔN kèm hướng hóa giải hoặc góc nhìn cân bằng.
6. KHÔNG nói "lá số cho thấy bạn sẽ..." — thay bằng "lá số cho thấy bạn có xu hướng..." hoặc "bạn thường...".`;

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

function stripViCombiningKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeLaSoAspectKey(key: string): string | null {
  const k = key.trim();
  if (LA_SO_KEY_ALIAS[k]) return LA_SO_KEY_ALIAS[k];
  if (LA_SO_ASPECT_ORDER.includes(k as (typeof LA_SO_ASPECT_ORDER)[number])) {
    return k;
  }
  const underscored = stripViCombiningKey(k).replace(/\s+/g, "_");
  if (
    LA_SO_ASPECT_ORDER.includes(
      underscored as (typeof LA_SO_ASPECT_ORDER)[number],
    )
  ) {
    return underscored;
  }
  const compact = underscored.replace(/_/g, "");
  for (const id of LA_SO_ASPECT_ORDER) {
    if (id.replace(/_/g, "") === compact) return id;
  }
  return null;
}

function coerceLaSoSectionText(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim().replace(/^\s*[-*•]\s+/gm, "").trim();
    return t.length > 0 ? t : null;
  }
  if (Array.isArray(v)) {
    const parts = v
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (!parts.length) return null;
    return parts.join(" ");
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const nest = o.text ?? o.body ?? o.content ?? o.noi_dung;
    return coerceLaSoSectionText(nest);
  }
  return null;
}

function sectionsFromExplicitArray(raw: unknown): LaSoChiTietSection[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LaSoChiTietSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const idRaw = typeof r.id === "string" ? r.id.trim() : "";
    const canon = normalizeLaSoAspectKey(idRaw);
    if (!canon) continue;
    const title =
      typeof r.title === "string" && r.title.trim()
        ? r.title.trim()
        : (LA_SO_ASPECT_TITLES[canon] ?? canon);
    const text = coerceLaSoSectionText(r.text);
    if (!text) continue;
    out.push({ id: canon, title, text });
  }
  return out.length > 0 ? out : null;
}

const LA_SO_NESTED_ASPECT_WRAPPERS = [
  "luan_giai",
  "luanGiai",
  "luận_giải",
  "reading",
  "chi_tiet",
  "chiTiet",
  "noi_dung",
  "noiDung",
] as const;

function flattenLaSoChiTietRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  let flat = { ...record };
  for (const w of LA_SO_NESTED_ASPECT_WRAPPERS) {
    const v = flat[w];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flat = { ...flat, ...(v as Record<string, unknown>) };
    }
  }
  return flat;
}

function parseLaSoChiTietSections(text: string): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(text);
  if (!record) return null;

  const fromArr = sectionsFromExplicitArray(record.sections);
  if (fromArr?.length) return fromArr;

  const flat = flattenLaSoChiTietRecord(record);
  const byId = new Map<string, string>();

  for (const key of Object.keys(flat)) {
    if (key === "sections") continue;
    if ((LA_SO_NESTED_ASPECT_WRAPPERS as readonly string[]).includes(key)) {
      continue;
    }
    const canon = normalizeLaSoAspectKey(key);
    if (!canon) continue;
    const t = coerceLaSoSectionText(flat[key]);
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
    console.warn("[luận-giải] Thiếu biến môi trường ANTHROPIC_API_KEY");
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
        "[luận-giải] Dịch vụ Anthropic trả HTTP",
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
    console.warn("[luận-giải] Lỗi khi gọi Anthropic:", e);
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

const LA_SO_CHI_TIET_RETRY_SYSTEM =
`Bạn nhận cùng JSON đầu vào (endpoint la-so-chi-tiet). Nhiệm vụ: CHỈ trả về một object JSON, không markdown, không \`\`\`, không lời dẫn.
Các khóa bắt buộc (chuỗi tiếng Việt, văn xuôi, không gạch đầu dòng): tinh_cach, su_nghiep, tai_van, suc_khoe, tinh_duyen.
Tạo đủ 5 khóa trừ khi dữ liệu đầu vào hoàn toàn không cho phép một mục (khi đó bỏ khóa đó hẳn).`;

async function anthropicLaSoChiTietStructRetry(
  userJson: string,
): Promise<string | null> {
  return await anthropicCompletion(
    LA_SO_CHI_TIET_RETRY_SYSTEM,
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
  const cacheInput =
    endpoint === "la-so-chi-tiet"
      ? `${LA_SO_CHI_TIET_CACHE_VER}\n${endpoint}\n${dataJson}`
      : endpoint === "tieu-van" || endpoint === "luu-nien"
        ? `${TIEU_VAN_LUU_NIEN_PROMPT_VER}\n${endpoint}\n${dataJson}`
        : `${endpoint}\n${dataJson}`;
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
      const retryText = await anthropicLaSoChiTietStructRetry(payload);
      if (retryText) {
        sections = parseLaSoChiTietSections(retryText);
      }
    }
    if (!sections?.length) {
      console.warn(
        "[luận-giải] la-so-chi-tiet: JSON rỗng hoặc không đọc được — thử luận giải một khối văn",
        raw.slice(0, 240),
      );
      const plain = await anthropicReading(payload);
      const t = plain?.trim() ?? "";
      if (!t) {
        console.warn(
          "[luận-giải] la-so-chi-tiet: luận giải dự phòng (một khối văn) thất bại",
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
