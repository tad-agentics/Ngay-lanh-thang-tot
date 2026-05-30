/** Cache invalidation versions per endpoint/prompt. */

export const DAY_DETAIL_FOLLOW_UP_VER = "2026-05-28-citations-v1";
export const LA_SO_CHI_TIET_CACHE_VER = "2026-05-30-menh-3para-800";
export const LA_SO_CHI_TIET_PREVIEW_PROMPT_VER = "2026-05-30-preview-3para-800";
export const TIEU_VAN_LUU_NIEN_PROMPT_VER = "2026-05-10-v1";
export const HOP_TUOI_PROMPT_VER = "2026-05-10-v1";
export const CHON_NGAY_PROMPT_VER = "2026-05-10-v1";
export const CHON_NGAY_CARDS_PROMPT_VER = "2026-05-10-v1";
export const DAY_DETAIL_MULTITURN_VER = "2026-05-29-multiturn-v1";
export const DAY_DETAIL_PROMPT_VER = "2026-05-28-luan-context-v1";
export const INLINE_LICH_TO_PROMPT_VER = "2026-05-28-v1";
/** Bump when switching provider/model — invalidates reading_cache. */
export const GLOBAL_LLM_VER = "2026-05-29-deepseek-pro-day-multiturn";

export function endpointCacheVersion(
  endpoint: string,
  opts: { preview: boolean; question: string; variant: string },
): string {
  const { preview, question, variant } = opts;
  if (endpoint === "la-so-chi-tiet") {
    return preview
      ? `${LA_SO_CHI_TIET_CACHE_VER}:${LA_SO_CHI_TIET_PREVIEW_PROMPT_VER}`
      : LA_SO_CHI_TIET_CACHE_VER;
  }
  if (endpoint === "tieu-van" || endpoint === "luu-nien") {
    return TIEU_VAN_LUU_NIEN_PROMPT_VER;
  }
  if (endpoint === "hop-tuoi") return HOP_TUOI_PROMPT_VER;
  if (endpoint === "day-detail") {
    if (question) return `${DAY_DETAIL_FOLLOW_UP_VER}:${DAY_DETAIL_MULTITURN_VER}`;
    if (variant === "inline") return INLINE_LICH_TO_PROMPT_VER;
    if (variant === "teaser") return `${DAY_DETAIL_PROMPT_VER}:teaser`;
    return DAY_DETAIL_PROMPT_VER;
  }
  if (endpoint === "chon-ngay") return CHON_NGAY_PROMPT_VER;
  if (endpoint === "chon-ngay-cards") return CHON_NGAY_CARDS_PROMPT_VER;
  if (endpoint === "ngay-hom-nay") return INLINE_LICH_TO_PROMPT_VER;
  return "";
}
