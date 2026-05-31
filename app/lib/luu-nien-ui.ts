import type { LaSoChiTietSection } from "~/lib/generate-reading";

/**
 * Chèn luận lưu niên sau `su_nghiep` nếu có (legacy aspects); không có thì sau §02.
 * §03 Vận năm màn 18.
 */
export function mergeLaSoWithLuuNienSections(
  laSoSections: LaSoChiTietSection[],
  luuNienSections: LaSoChiTietSection[],
): LaSoChiTietSection[] {
  if (luuNienSections.length === 0) return laSoSections;

  const prefixed = luuNienSections.map((s) => ({
    ...s,
    id: s.id.startsWith("luu_nien_") ? s.id : `luu_nien_${s.id}`,
  }));

  const suNghiepIdx = laSoSections.findIndex((s) => s.id === "su_nghiep");
  const insertAt = suNghiepIdx >= 0 ? suNghiepIdx + 1 : Math.min(2, laSoSections.length);

  return [
    ...laSoSections.slice(0, insertAt),
    ...prefixed,
    ...laSoSections.slice(insertAt),
  ];
}

/** Gộp kết quả hai invoke `only_luu_nien_life` + `only_luu_nien_core`. */
export function mergeLuuNienGenerateSections(
  lifeSections: LaSoChiTietSection[],
  coreSections: LaSoChiTietSection[],
): LaSoChiTietSection[] {
  const byId = new Map<string, LaSoChiTietSection>();
  for (const s of [...lifeSections, ...coreSections]) {
    const id = s.id.startsWith("luu_nien_") ? s.id : `luu_nien_${s.id}`;
    byId.set(id, { ...s, id });
  }
  return [...byId.values()];
}

export function luuNienQuyNhanProseFromSections(
  sections: LaSoChiTietSection[],
): string {
  return sections.find((s) => s.id === "luu_nien_ung_xu")?.text?.trim() ?? "";
}

/** Tối thiểu ký tự §05 — khớp `MIN_TIEU_VAN_SECTION_CHARS` Edge core. */
export const MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS = 320;

export function hasLuuNienQuyNhanLuanFromSections(
  sections: LaSoChiTietSection[],
): boolean {
  return (
    luuNienQuyNhanProseFromSections(sections).length >=
    MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS
  );
}

export function luuNienSectionsFromGenerateReading(
  sections: LaSoChiTietSection[] | null,
  reading: string | null,
): LaSoChiTietSection[] {
  if (sections && sections.length > 0) {
    return sections.map((s) => ({
      ...s,
      id: s.id.startsWith("luu_nien_") ? s.id : `luu_nien_${s.id}`,
    }));
  }
  const text = reading?.trim();
  if (!text) return [];
  return [{ id: "luu_nien_van", title: "Vận năm", text }];
}
