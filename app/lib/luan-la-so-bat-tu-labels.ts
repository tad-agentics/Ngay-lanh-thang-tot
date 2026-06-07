/**
 * User-facing name for addon SKU `luan_bat_tu` / route `/toi/luan-bat-tu`.
 */
export const LUAN_LA_SO_BAT_TU_TITLE = "Luận giải lá số Bát tự";

export const LUAN_LA_SO_BAT_TU_TITLE_SHORT = "Lá số Bát tự";

export const LUAN_LA_SO_BAT_TU_TAGLINE =
  "tính cách · vận năm · phong thuỷ · quý nhân";

/** Một câu blur trên card `/lich` — gợi mở bài paywall, không lộ mock chương. */
export function homeBaziPaywallBlurHook(yearCanChi: string): string {
  const year = yearCanChi.trim();
  if (year) {
    return `Còn luận về tính cách, vận năm ${year}, phong thủy và quý nhân — toàn bộ viết riêng từ lá số của bạn.`;
  }
  return "Còn luận về tính cách, vận năm, phong thủy và quý nhân — toàn bộ viết riêng từ lá số của bạn.";
}
