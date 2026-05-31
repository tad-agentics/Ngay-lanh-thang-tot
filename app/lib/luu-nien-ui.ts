import type { LaSoChiTietSection } from "~/lib/generate-reading";

/** Chèn luận lưu niên (Edge `generate-reading-luu-nien`) sau `su_nghiep` — §03 Vận năm màn 18. */
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
