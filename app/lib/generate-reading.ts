import { FunctionsHttpError } from "@supabase/supabase-js";

import { generateReadingFunctionName } from "~/lib/generate-reading-functions";
import { sanitizeNlttLuanProse } from "~/lib/nltt-luan-prose";
import { isSubExpiredCode, notifySubExpired } from "~/lib/sub-expired";
import { supabase } from "~/lib/supabase";

export type LaSoChiTietSection = {
  id: string;
  title: string;
  text: string;
};

export type LuanThreadTurn = {
  role: "user" | "assistant";
  content: string;
};

export type GenerateReadingInput = {
  endpoint: string;
  data: unknown;
  /** Optional follow-up question for day-detail anchor extensions. */
  question?: string;
  /** Anchor luận giải (day-detail follow-up multi-turn). */
  anchor_reading?: string;
  /** Prior Q/A turns, max 8 messages (4 pairs). */
  thread_history?: LuanThreadTurn[];
  /** `inline` = lịch tờ ngắn; `teaser` = chưa gói — auth only, subscription gate on server. */
  variant?: "inline" | "teaser";
  /** `la-so-chi-tiet` paywall — chỉ trả `menh_tong_quan` cho user chưa mở khóa. */
  preview?: boolean;
  /** `la-so-chi-tiet` — chỉ sinh §02 khi full bundle thiếu traits. */
  only_tinh_cach?: boolean;
  /** `luu-nien` — chỉ sinh §03 life_areas. */
  only_luu_nien_life?: boolean;
  /** `luu-nien` — chỉ sinh §05 core (`luu_nien_ung_xu`, …). */
  only_luu_nien_core?: boolean;
  /** Bổ sung §02 — chỉ sinh các trait id thiếu (gap-fill). */
  tinh_cach_trait_ids?: string[];
  /** Bổ sung §03 — chỉ sinh các life_area id thiếu (gap-fill). */
  luu_nien_life_area_ids?: string[];
  /** `van-trinh-nam` — chỉ Phần A (lưu niên năm). */
  only_van_trinh_a?: boolean;
  /** `van-trinh-nam` — chỉ Phần C (kết bài). */
  only_van_trinh_c?: boolean;
  /** `van-trinh-nam` — luận một tháng (1–12). */
  month_num?: number;
  /** Năm dương — cache key. */
  flow_year?: number;
};

/** Invoke failed before a valid 200 body (504 gateway, network, other HTTP). */
export type GenerateReadingTransportError =
  | "gateway_timeout"
  | "invoke_failed"
  /** Tab background / đổi mạng — Chrome ERR_NETWORK_* */
  | "network_interrupted";

export type GenerateReadingResponse = {
  reading: string | null;
  sections: LaSoChiTietSection[] | null;
  /** `chon-ngay-cards` — map ISO ngày → đoạn luận giải trên thẻ. */
  dayReadings: Record<string, string> | null;
  transportError?: GenerateReadingTransportError;
};

const EMPTY_GENERATE_READING: GenerateReadingResponse = {
  reading: null,
  sections: null,
  dayReadings: null,
};

function functionsHttpStatus(error: FunctionsHttpError): number | undefined {
  const ctx = error.context;
  if (
    ctx &&
    typeof ctx === "object" &&
    "status" in ctx &&
    typeof (ctx as Response).status === "number"
  ) {
    return (ctx as Response).status;
  }
  return undefined;
}

function transportErrorFromStatus(
  status: number | undefined,
): GenerateReadingTransportError {
  if (status === 504 || status === 502 || status === 503) {
    return "gateway_timeout";
  }
  return "invoke_failed";
}

/** Chrome: IO_SUSPENDED, NETWORK_CHANGED, Failed to fetch, … */
export function isClientNetworkFailure(error: unknown): boolean {
  const parts: string[] = [];
  if (error instanceof Error) {
    parts.push(error.message, error.name);
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause instanceof Error) parts.push(cause.message);
  } else if (typeof error === "string") {
    parts.push(error);
  } else if (error && typeof error === "object" && "message" in error) {
    parts.push(String((error as { message: unknown }).message));
  }
  const blob = parts.join(" ").toLowerCase();
  return (
    blob.includes("failed to fetch") ||
    blob.includes("load failed") ||
    blob.includes("network error") ||
    blob.includes("err_network") ||
    blob.includes("io_suspended") ||
    blob.includes("network_changed") ||
    blob.includes("internet connection appears to be offline")
  );
}

function transportErrorFromInvoke(
  error: unknown,
): GenerateReadingTransportError {
  if (isClientNetworkFailure(error)) {
    return "network_interrupted";
  }
  if (error instanceof FunctionsHttpError) {
    const status = functionsHttpStatus(error);
    if (status === undefined && isClientNetworkFailure(error.message)) {
      return "network_interrupted";
    }
    return transportErrorFromStatus(status);
  }
  return "invoke_failed";
}

/** Giới hạn payload — endpoint ngắn (ngày, tiểu vận 3 phần). */
const MAX_LUAN_SECTION_COUNT_DEFAULT = 10;
/** Bát Tự bundle: menh + traits + aspects + lưu niên life + phong thủy. */
const MAX_LUAN_SECTION_COUNT_BAZI_BUNDLE = 32;

function maxLaSoSectionsForEndpoint(endpoint: string): number {
  if (
    endpoint === "la-so-chi-tiet" ||
    endpoint === "luu-nien" ||
    endpoint === "phong-thuy" ||
    endpoint === "van-trinh-nam"
  ) {
    return MAX_LUAN_SECTION_COUNT_BAZI_BUNDLE;
  }
  return MAX_LUAN_SECTION_COUNT_DEFAULT;
}
const MAX_LUAN_ID_CHARS = 64;
const MAX_LUAN_TITLE_CHARS = 120;
const MAX_LUAN_TEXT_CHARS = 32_000;
const MAX_DAY_READING_KEYS = 8;
const MAX_DAY_READING_VALUE_CHARS = 12_000;

function normalizeDayKeyToIso(key: string): string | null {
  const t = key.trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1000 || y > 9999 || mo < 1 || mo > 12 || d < 1 || d > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function normalizeDayReadingsClient(
  raw: unknown,
): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const iso = normalizeDayKeyToIso(k);
    if (!iso) continue;
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t) continue;
    const capped = t.slice(0, MAX_DAY_READING_VALUE_CHARS);
    const prev = out[iso];
    if (prev != null && prev.length >= capped.length) continue;
    out[iso] = capped;
  }
  const keys = Object.keys(out).sort();
  if (keys.length === 0) return null;
  if (keys.length <= MAX_DAY_READING_KEYS) return out;
  const trimmed: Record<string, string> = {};
  for (const k of keys.slice(0, MAX_DAY_READING_KEYS)) {
    trimmed[k] = out[k]!;
  }
  return trimmed;
}

function normalizeLaSoSections(
  raw: unknown,
  maxCount = MAX_LUAN_SECTION_COUNT_BAZI_BUNDLE,
): LaSoChiTietSection[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LaSoChiTietSection[] = [];
  for (const row of raw) {
    if (out.length >= maxCount) break;
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const id =
      typeof r.id === "string"
        ? r.id.trim().slice(0, MAX_LUAN_ID_CHARS)
        : "";
    const title =
      typeof r.title === "string"
        ? r.title.trim().slice(0, MAX_LUAN_TITLE_CHARS)
        : "";
    let text =
      typeof r.text === "string"
        ? sanitizeNlttLuanProse(r.text.trim())
        : "";
    if (text.length > MAX_LUAN_TEXT_CHARS) {
      text = text.slice(0, MAX_LUAN_TEXT_CHARS);
    }
    if (!id || !text) continue;
    out.push({
      id,
      title: title.length > 0 ? title : id,
      text,
    });
  }
  return out.length > 0 ? out : null;
}

/** `reading` / section.text là JSON `{"sections":[...]}` (cache cũ). */
export function parseSectionsEnvelopeFromReadingJson(
  reading: string | null | undefined,
  idPrefix?: string,
): LaSoChiTietSection[] {
  const raw = reading?.trim() ?? "";
  if (!raw.startsWith("{") || !raw.includes('"sections"')) return [];
  try {
    const o = JSON.parse(raw) as { sections?: unknown };
    if (!Array.isArray(o.sections)) return [];
    const normalized = normalizeLaSoSections(o.sections);
    if (!normalized?.length) return [];
    if (!idPrefix) return normalized;
    return normalized.map((s) => ({
      ...s,
      id: s.id.startsWith(idPrefix) ? s.id : `${idPrefix}${s.id}`,
    }));
  } catch {
    return [];
  }
}

/** Gỡ blob JSON nhúng trong `phong_thuy_van` / `tong_hop` sau cache lỗi. */
export function expandEmbeddedSectionsEnvelope(
  sections: LaSoChiTietSection[],
): LaSoChiTietSection[] {
  const out: LaSoChiTietSection[] = [];
  for (const s of sections) {
    const trimmed = s.text.trim();
    if (trimmed.startsWith("{") && trimmed.includes('"sections"')) {
      const parsed = parseSectionsEnvelopeFromReadingJson(trimmed);
      if (parsed.length > 0) {
        out.push(...parsed);
        continue;
      }
    }
    out.push(s);
  }
  return out;
}

/** Chuẩn hóa mảng section (phản hồi máy chủ hoặc session); rỗng nếu không hợp lệ. */
export function normalizeLaSoSectionsInput(
  raw: unknown,
  maxCount = MAX_LUAN_SECTION_COUNT_BAZI_BUNDLE,
): LaSoChiTietSection[] {
  const base = normalizeLaSoSections(raw, maxCount) ?? [];
  return expandEmbeddedSectionsEnvelope(base);
}

/** Gộp `sections` + `reading` từ generate-reading (tránh bọc JSON vào `tong_hop`). */
export function coalesceGenerateReadingSections(
  sections: LaSoChiTietSection[] | null,
  reading: string | null,
  opts?: { idPrefix?: string; legacyId?: string; legacyTitle?: string },
): LaSoChiTietSection[] {
  const prefix = opts?.idPrefix ?? "";
  if (sections && sections.length > 0) {
    const mapped = prefix
      ? sections.map((s) => ({
          ...s,
          id: s.id.startsWith(prefix) ? s.id : `${prefix}${s.id}`,
        }))
      : sections;
    return normalizeLaSoSectionsInput(mapped);
  }
  const fromJson = parseSectionsEnvelopeFromReadingJson(reading, prefix || undefined);
  if (fromJson.length > 0) return normalizeLaSoSectionsInput(fromJson);
  const text = reading?.trim();
  if (!text || text.startsWith("{")) return [];
  const legacyId = opts?.legacyId ?? "tong_hop";
  return normalizeLaSoSectionsInput([
    {
      id: prefix ? `${prefix}${legacyId}` : legacyId,
      title: opts?.legacyTitle ?? "Luận giải",
      text,
    },
  ]);
}

/** Gộp wave luận theo `id` (upsert incoming lên base). */
export function mergeLaSoChiTietSectionsById(
  existing: LaSoChiTietSection[],
  incoming: LaSoChiTietSection[] | null | undefined,
): LaSoChiTietSection[] {
  if (!incoming?.length) return existing;
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const s of incoming) {
    byId.set(s.id, s);
  }
  return [...byId.values()];
}

/** `sections` + JSON envelope trong `reading` từ một lần gọi generate-reading. */
export function laSoSectionsFromGenerateReadingResponse(
  res: Pick<GenerateReadingResponse, "sections" | "reading">,
): LaSoChiTietSection[] {
  return coalesceGenerateReadingSections(res.sections, res.reading);
}

type GenerateReadingErrorBody = {
  error?: { code?: string; message?: string };
  error_code?: string;
  message?: string;
};

export function isGenerateReadingRateLimitedBody(body: unknown): boolean {
  const parsed = parseGenerateReadingError(body);
  return parsed?.code === "RATE_LIMIT_UNAVAILABLE";
}

function parseGenerateReadingError(
  body: unknown,
): { code: string; message: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const rec = body as GenerateReadingErrorBody;
  if (rec.error && typeof rec.error === "object") {
    const code =
      typeof rec.error.code === "string" ? rec.error.code : "GENERATE_READING";
    const message =
      typeof rec.error.message === "string" && rec.error.message.length
        ? rec.error.message
        : "Không tạo luận giải được.";
    return { code, message };
  }
  if (typeof rec.error_code === "string") {
    return {
      code: rec.error_code,
      message:
        typeof rec.message === "string" && rec.message.length
          ? rec.message
          : "Không tạo luận giải được.",
    };
  }
  return null;
}

function handleGenerateReadingErrorCode(code: string): void {
  if (isSubExpiredCode(code)) notifySubExpired();
}

/**
 * Gọi Edge luận giải (day | la-so | tieu-van | luu-nien) — luôn HTTP 200.
 * `reading` / `sections` / `dayReadings` tùy endpoint có thể null.
 */
function generateReadingResponseEmpty(res: GenerateReadingResponse): boolean {
  return (
    !res.reading &&
    (!res.sections || res.sections.length === 0) &&
    (!res.dayReadings || Object.keys(res.dayReadings).length === 0)
  );
}

const RATE_LIMIT_RETRY_MS = 11_000;
const NETWORK_RETRY_DELAYS_MS = [2_000, 5_000] as const;

function shouldRetryRateLimitEmpty(res: GenerateReadingResponse): boolean {
  return generateReadingResponseEmpty(res) && !res.transportError;
}

function shouldRetryNetwork(res: GenerateReadingResponse): boolean {
  return res.transportError === "network_interrupted";
}

function shouldRetryGatewayTimeout(res: GenerateReadingResponse): boolean {
  return res.transportError === "gateway_timeout";
}

/**
 * Gọi Edge luận giải; retry khi 200 rỗng (rate limit) hoặc mạng tab bị ngắt.
 */
export async function invokeGenerateReadingWithRetry(
  input: GenerateReadingInput,
): Promise<GenerateReadingResponse> {
  let res = await invokeGenerateReading(input);

  if (shouldRetryRateLimitEmpty(res)) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    res = await invokeGenerateReading(input);
  }

  if (shouldRetryGatewayTimeout(res)) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    res = await invokeGenerateReading(input);
    if (shouldRetryRateLimitEmpty(res)) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
      res = await invokeGenerateReading(input);
    }
  }

  for (const waitMs of NETWORK_RETRY_DELAYS_MS) {
    if (!shouldRetryNetwork(res)) break;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    res = await invokeGenerateReading(input);
    if (shouldRetryRateLimitEmpty(res)) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
      res = await invokeGenerateReading(input);
    }
  }

  if (generateReadingResponseEmpty(res) && import.meta.env.DEV) {
    console.warn("[luận-giải] Edge trả rỗng sau retry", input.endpoint);
  }
  if (shouldRetryNetwork(res) && import.meta.env.DEV) {
    console.warn("[luận-giải] Mạng client ngắt sau retry", input.endpoint);
  }
  return res;
}

export async function invokeGenerateReading(
  input: GenerateReadingInput,
): Promise<GenerateReadingResponse> {
  const functionName = generateReadingFunctionName(input.endpoint);
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data, error } =
      await supabase.functions.invoke<unknown>(functionName, {
        body: input,
        ...(session?.access_token
          ? {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          : {}),
      });
    if (error) {
      if (error instanceof FunctionsHttpError) {
        try {
          const body = (await error.context.json()) as unknown;
          if (isGenerateReadingRateLimitedBody(body)) {
            return { ...EMPTY_GENERATE_READING };
          }
          const parsed = parseGenerateReadingError(body);
          if (parsed) {
            handleGenerateReadingErrorCode(parsed.code);
          }
          if (import.meta.env.DEV) {
            console.warn("[luận-giải]", error.message, body);
          }
        } catch {
          if (import.meta.env.DEV) {
            console.warn("[luận-giải]", error.message);
          }
        }
      } else if (import.meta.env.DEV) {
        console.warn("[luận-giải]", error);
      }
      return {
        ...EMPTY_GENERATE_READING,
        transportError: transportErrorFromInvoke(error),
      };
    }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      if (isGenerateReadingRateLimitedBody(data)) {
        return { ...EMPTY_GENERATE_READING };
      }
      const parsedErr = parseGenerateReadingError(data);
      if (parsedErr) {
        handleGenerateReadingErrorCode(parsedErr.code);
        return { ...EMPTY_GENERATE_READING, transportError: "invoke_failed" };
      }
      const d = data as Record<string, unknown>;
      const readingRaw = d.reading;
      const reading =
        typeof readingRaw === "string" && readingRaw.trim()
          ? readingRaw.trim()
          : null;
      const sections = normalizeLaSoSections(
        d.sections,
        maxLaSoSectionsForEndpoint(input.endpoint),
      );
      const dayReadings = normalizeDayReadingsClient(d.day_readings);
      return { reading, sections, dayReadings };
    }
    return { ...EMPTY_GENERATE_READING, transportError: "invoke_failed" };
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[luận-giải] Gọi Edge thất bại:", e);
    }
    return {
      ...EMPTY_GENERATE_READING,
      transportError: transportErrorFromInvoke(e),
    };
  }
}
