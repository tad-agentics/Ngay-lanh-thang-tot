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
  /** Bundle xong mà mục này chưa đủ luận delivery. */
  luanFailed?: boolean;
  /** Mục này đang chờ LLM (các mục khác có thể đã hiện). */
  luanLoading?: boolean;
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

/** Đủ độ dài delivery §03 (420 ký tự, 3 đoạn). */
export function isLifeAreaLuanDeliveryComplete(text: string): boolean {
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
      let luan =
        luanById.get(key) ??
        luanById.get(normalizeAreaId(area.label)) ??
        "";
      if (!luan) {
        for (const [id, text] of luanById) {
          if (id.includes(key) || key.includes(id)) {
            luan = text;
            break;
          }
        }
      }
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

/** Có luận LLM hiển thị được cho §03 (không dùng nhịp năm / vanProse chung). */
export function hasLuuNienLifeAreaDisplayLuan(
  lifeAreas: LuuNienLifeAreaView[],
  expectedCount = LUU_NIEN_FULL_LIFE_AREA_COUNT,
): boolean {
  const withLuan = lifeAreas.filter((a) => a.luan.trim().length >= 80);
  return withLuan.length >= expectedCount;
}

/** Đủ luận §03 life_areas (mặc định 4 mục đủ độ dài). */
export function hasLuuNienLifeLuanFromSections(
  sections: LaSoChiTietSection[],
  expectedCount = LUU_NIEN_FULL_LIFE_AREA_COUNT,
): boolean {
  const areas = parseLifeAreaLuanFromSections(sections).filter((a) =>
    isLifeAreaLuanDeliveryComplete(a.text),
  );
  return areas.length >= expectedCount;
}

/** Life area id chưa đủ luận delivery — gọi supplement `luu_nien_life_area_ids`. */
export function missingLuuNienLifeAreaIds(
  facts: LuuNienFactsView | null,
  sections: LaSoChiTietSection[],
): string[] {
  const merged = mergeLuuNienLifeAreasWithLuan(facts, sections);
  if (merged.length > 0) {
    return merged
      .filter((a) => !isLifeAreaLuanDeliveryComplete(a.luan))
      .map((a) => normalizeAreaId(a.id));
  }
  const fromLlm = parseLifeAreaLuanFromSections(sections).filter(
    (a) => !isLifeAreaLuanDeliveryComplete(a.text),
  );
  return fromLlm.map((a) => normalizeAreaId(a.id));
}
