import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "~/lib/supabase";

export type LaSoChiTietSection = {
  id: string;
  title: string;
  text: string;
};

export type GenerateReadingInput = {
  endpoint: string;
  data: unknown;
};

export type GenerateReadingResponse = {
  reading: string | null;
  sections: LaSoChiTietSection[] | null;
  /** `chon-ngay-cards` — map ISO ngày → đoạn luận giải trên thẻ. */
  dayReadings: Record<string, string> | null;
};

/** Giới hạn payload/ sessionStorage — chống dữ liệu bất thường làm nặng DOM. */
const MAX_LUAN_SECTION_COUNT = 10;
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
): LaSoChiTietSection[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LaSoChiTietSection[] = [];
  for (const row of raw) {
    if (out.length >= MAX_LUAN_SECTION_COUNT) break;
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
      typeof r.text === "string" ? r.text.trim() : "";
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

/** Chuẩn hóa mảng section (phản hồi máy chủ hoặc session); rỗng nếu không hợp lệ. */
export function normalizeLaSoSectionsInput(raw: unknown): LaSoChiTietSection[] {
  return normalizeLaSoSections(raw) ?? [];
}

/**
 * Gọi Edge luận giải (`generate-reading`) — luôn HTTP 200.
 * `reading` / `sections` / `dayReadings` tùy endpoint có thể null.
 */
export async function invokeGenerateReading(
  input: GenerateReadingInput,
): Promise<GenerateReadingResponse> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data, error } =
      await supabase.functions.invoke<unknown>("generate-reading", {
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
      if (import.meta.env.DEV) {
        if (error instanceof FunctionsHttpError) {
          try {
            const body = (await error.context.json()) as unknown;
            console.warn("[luận-giải]", error.message, body);
          } catch {
            console.warn("[luận-giải]", error.message);
          }
        } else {
          console.warn("[luận-giải]", error);
        }
      }
      return { reading: null, sections: null, dayReadings: null };
    }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      const readingRaw = d.reading;
      const reading =
        typeof readingRaw === "string" && readingRaw.trim()
          ? readingRaw.trim()
          : null;
      const sections = normalizeLaSoSections(d.sections);
      const dayReadings = normalizeDayReadingsClient(d.day_readings);
      return { reading, sections, dayReadings };
    }
    return { reading: null, sections: null, dayReadings: null };
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[luận-giải] Gọi Edge thất bại:", e);
    }
    return { reading: null, sections: null, dayReadings: null };
  }
}
