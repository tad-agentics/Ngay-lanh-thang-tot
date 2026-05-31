import type { LaSoChiTietSection } from "~/lib/generate-reading";
import type { LuuNienFactsView, LuuNienLifeArea } from "~/lib/luu-nien-facts-ui";

export const LUU_NIEN_YEAR_INTRO_SECTION_ID = "luu_nien_year_intro";
export const LUU_NIEN_LIFE_AREA_PREFIX = "luu_nien_life_";

/** Số lĩnh vực life_areas chuẩn trên màn §03 — khớp parser Edge. */
export const LUU_NIEN_FULL_LIFE_AREA_COUNT = 4;

/** Tối thiểu ký tự / mục — khớp `MIN_LUU_NIEN_LIFE_AREA_CHARS` Edge (~500 chữ). */
export const MIN_LUU_NIEN_LIFE_LUAN_CHARS = 420;
export const MIN_LUU_NIEN_LIFE_LUAN_PARAGRAPHS = 3;

function countParagraphs(text: string): number {
  return text
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

export type LuuNienLifeAreaView = LuuNienLifeArea & {
  /** Luận dài từ generate-reading; ưu tiên hơn `detail` API. */
  luan: string;
};

function normalizeAreaId(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

/** §03 — các block `luu_nien_life_*` từ Edge. */
export function parseLifeAreaLuanFromSections(
  sections: LaSoChiTietSection[],
): { id: string; title: string; text: string }[] {
  const out: { id: string; title: string; text: string }[] = [];
  for (const s of sections) {
    if (!s.id.startsWith(LUU_NIEN_LIFE_AREA_PREFIX)) continue;
    const text = s.text?.trim() ?? "";
    if (!text) continue;
    out.push({
      id: s.id.slice(LUU_NIEN_LIFE_AREA_PREFIX.length),
      title: s.title?.trim() || s.id,
      text,
    });
  }
  return out;
}

function isCompleteLifeAreaLuan(text: string): boolean {
  const t = text.trim();
  return (
    t.length >= MIN_LUU_NIEN_LIFE_LUAN_CHARS &&
    countParagraphs(t) >= MIN_LUU_NIEN_LIFE_LUAN_PARAGRAPHS
  );
}

export function luuNienYearIntroFromSections(
  sections: LaSoChiTietSection[],
): string {
  const intro = sections.find((s) => s.id === LUU_NIEN_YEAR_INTRO_SECTION_ID);
  return intro?.text?.trim() ?? "";
}

export function mergeLuuNienLifeAreasWithLuan(
  facts: LuuNienFactsView | null,
  sections: LaSoChiTietSection[],
): LuuNienLifeAreaView[] {
  const fromLlm = parseLifeAreaLuanFromSections(sections);
  const luanById = new Map(
    fromLlm.map((x) => [normalizeAreaId(x.id), x.text]),
  );

  if (facts?.lifeAreas.length) {
    return facts.lifeAreas.map((area) => {
      const key = normalizeAreaId(area.id);
      const luan =
        luanById.get(key) ??
        luanById.get(normalizeAreaId(area.label)) ??
        "";
      return { ...area, luan };
    });
  }

  return fromLlm.map((x) => ({
    id: x.id,
    label: x.title,
    verdict: "",
    detail: "",
    luan: x.text,
  }));
}

/** Đủ luận §03 life_areas (mặc định 4 mục đủ độ dài). */
export function hasLuuNienLifeLuanFromSections(
  sections: LaSoChiTietSection[],
  expectedCount = LUU_NIEN_FULL_LIFE_AREA_COUNT,
): boolean {
  const areas = parseLifeAreaLuanFromSections(sections).filter((a) =>
    isCompleteLifeAreaLuan(a.text),
  );
  return areas.length >= expectedCount;
}
