import { sanitizeNlttLuanProse } from "../../nltt-luan-prose.ts";
import {
  MIN_LUU_NIEN_LIFE_AREA_CHARS,
  MIN_LUU_NIEN_LIFE_AREA_PARAGRAPHS,
} from "../core/config.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import { tryParseLaSoChiTietRecord } from "./json.ts";
import { countMenhPreviewParagraphs } from "./la-so.ts";

export const LUU_NIEN_YEAR_INTRO_SECTION_ID = "luu_nien_year_intro";
export const LUU_NIEN_LIFE_AREA_PREFIX = "luu_nien_life_";

export type LuuNienLifeAreasPayload = {
  yearIntro: string | null;
  areas: LaSoChiTietSection[];
};

function normalizeLifeAreaId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "area";
}

function coerceLifeAreaText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = sanitizeNlttLuanProse(v.trim());
  return t.length > 0 ? t : null;
}

export const MIN_LUU_NIEN_LIFE_AREA_CHARS_RELAXED = 240;
export const MIN_LUU_NIEN_LIFE_AREA_PARAGRAPHS_RELAXED = 2;

export function luuNienLifeAreaProseTooShort(
  text: string,
  relaxed = false,
): boolean {
  const t = text.trim();
  if (relaxed) {
    if (t.length < MIN_LUU_NIEN_LIFE_AREA_CHARS_RELAXED) return true;
    if (countMenhPreviewParagraphs(t) < MIN_LUU_NIEN_LIFE_AREA_PARAGRAPHS_RELAXED) {
      return true;
    }
    return false;
  }
  if (t.length < MIN_LUU_NIEN_LIFE_AREA_CHARS) return true;
  if (countMenhPreviewParagraphs(t) < MIN_LUU_NIEN_LIFE_AREA_PARAGRAPHS) {
    return true;
  }
  return false;
}

export function parseLuuNienLifeAreasResponse(
  raw: string,
  opts?: { relaxed?: boolean },
): LuuNienLifeAreasPayload | null {
  const relaxed = opts?.relaxed === true;
  const record = tryParseLaSoChiTietRecord(raw);
  if (!record) return null;

  const introRaw = record.luu_nien_year_intro ?? record.luuNienYearIntro;
  const yearIntro =
    typeof introRaw === "string" && introRaw.trim().length >= 80
      ? sanitizeNlttLuanProse(introRaw.trim())
      : null;

  const readingsRaw = record.life_area_readings ?? record.lifeAreaReadings;
  if (!Array.isArray(readingsRaw)) {
    return yearIntro ? { yearIntro, areas: [] } : null;
  }

  const areas: LaSoChiTietSection[] = [];
  for (const row of readingsRaw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const label =
      typeof r.label === "string" && r.label.trim()
        ? r.label.trim()
        : "Lĩnh vực";
    const id = normalizeLifeAreaId(
      typeof r.id === "string" ? r.id : label,
    );
    const text = coerceLifeAreaText(r.text);
    if (!text || luuNienLifeAreaProseTooShort(text, relaxed)) continue;
    areas.push({
      id: `${LUU_NIEN_LIFE_AREA_PREFIX}${id}`,
      title: label,
      text,
    });
  }

  if (!yearIntro && areas.length === 0) return null;
  return { yearIntro, areas };
}

export function luuNienLifeAreasToSections(
  payload: LuuNienLifeAreasPayload,
): LaSoChiTietSection[] {
  const out: LaSoChiTietSection[] = [];
  if (payload.yearIntro) {
    out.push({
      id: LUU_NIEN_YEAR_INTRO_SECTION_ID,
      title: "Nhịp năm",
      text: payload.yearIntro,
    });
  }
  out.push(...payload.areas);
  return out;
}
