/**
 * User-facing name for addon SKU `luan_bat_tu` / route `/toi/luan-bat-tu`.
 */
export const LUAN_LA_SO_BAT_TU_TITLE = "Luận giải lá số Bát tự";

export const LUAN_LA_SO_BAT_TU_TITLE_SHORT = "Lá số Bát tự";

export const LUAN_LA_SO_BAT_TU_TAGLINE =
  "tính cách · vận năm · phong thuỷ · quý nhân";

export const LUAN_LA_SO_BAT_TU_FREE_WITH_YEARLY = "hoặc miễn phí với Lịch năm";

/** Một câu blur trên card preview `/toi` — gợi ấn vào đọc chi tiết paywall. */
export function homeBaziPaywallBlurHook(yearCanChi: string): string {
  const year = yearCanChi.trim();
  if (year) {
    return `Ấn vào để đọc chi tiết tính cách, vận năm ${year}, phong thủy và quý nhân — luận riêng từ lá số của bạn.`;
  }
  return "Ấn vào để đọc chi tiết tính cách, vận năm, phong thủy và quý nhân — luận riêng từ lá số của bạn.";
}
