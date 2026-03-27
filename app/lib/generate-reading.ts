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
};

/** Giới hạn payload/ sessionStorage — chống dữ liệu bất thường làm nặng DOM. */
const MAX_LUAN_SECTION_COUNT = 10;
const MAX_LUAN_ID_CHARS = 64;
const MAX_LUAN_TITLE_CHARS = 120;
const MAX_LUAN_TEXT_CHARS = 32_000;

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
 * Gọi Edge luận giải (`generate-reading`) — luôn HTTP 200; reading/sections có thể null.
 */
export async function invokeGenerateReading(
  input: GenerateReadingInput,
): Promise<GenerateReadingResponse> {
  try {
    const { data, error } =
      await supabase.functions.invoke<unknown>("generate-reading", {
        body: input,
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
      return { reading: null, sections: null };
    }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      const readingRaw = d.reading;
      const reading =
        typeof readingRaw === "string" && readingRaw.trim()
          ? readingRaw.trim()
          : null;
      const sections = normalizeLaSoSections(d.sections);
      return { reading, sections };
    }
    return { reading: null, sections: null };
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[luận-giải] Gọi Edge thất bại:", e);
    }
    return { reading: null, sections: null };
  }
}
