/** Cache invalidation versions per endpoint/prompt. */

export const DAY_DETAIL_FOLLOW_UP_VER = "2026-05-28-citations-v1";
export const LA_SO_CHI_TIET_CACHE_VER = "2026-05-31-bazi-bundle-v4";
export const LUU_NIEN_ONLY_LIFE_CACHE_VER = "2026-05-31-luu-life-scoped-v4";
export const LUU_NIEN_ONLY_CORE_CACHE_VER = "2026-05-31-luu-quy-800c-v1";
export const LA_SO_CHI_TIET_ONLY_TINH_CACH_CACHE_VER =
  "2026-05-31-tinh-cach-scoped-v3";
export const LA_SO_CHI_TIET_PREVIEW_PROMPT_VER =
  "2026-06-07-preview-mirror-open-v1";
export const TIEU_VAN_PROMPT_VER = "2026-05-31-tieu-van-split-v1";
export const LUU_NIEN_PROMPT_VER = "2026-05-31-menh-tinh-luu-500w";
export const PHONG_THUY_SECTIONS_CACHE_VER = "2026-05-31-phong-3blocks-v1";
export const VAN_TRINH_NAM_PROMPT_VER = "2026-06-02-van-trinh-nam-v1";
/** @deprecated Use LUU_NIEN_PROMPT_VER or TIEU_VAN_PROMPT_VER */
export const TIEU_VAN_LUU_NIEN_PROMPT_VER = LUU_NIEN_PROMPT_VER;
export const HOP_TUOI_PROMPT_VER = "2026-05-10-v1";
export const CHON_NGAY_PROMPT_VER = "2026-05-10-v1";
export const CHON_NGAY_CARDS_PROMPT_VER = "2026-05-10-v1";
export const DAY_DETAIL_MULTITURN_VER = "2026-05-29-multiturn-v1";
export const DAY_DETAIL_PROMPT_VER = "2026-06-07-anchor-no-thinking-v1";
export const INLINE_LICH_TO_PROMPT_VER = "2026-05-28-v1";
/** Bump when switching provider/model — invalidates reading_cache. */
export const GLOBAL_LLM_VER = "2026-06-07-all-flash-no-thinking-v1";

export function endpointCacheVersion(
  endpoint: string,
  opts: {
    preview: boolean;
    onlyTinhCach?: boolean;
    onlyLuuNienLife?: boolean;
    onlyLuuNienCore?: boolean;
    question: string;
    variant: string;
  },
): string {
  const { preview, onlyTinhCach, onlyLuuNienLife, onlyLuuNienCore, question, variant } =
    opts;
  if (endpoint === "la-so-chi-tiet") {
    if (onlyTinhCach) {
      return `${LA_SO_CHI_TIET_CACHE_VER}:${LA_SO_CHI_TIET_ONLY_TINH_CACH_CACHE_VER}`;
    }
    return preview
      ? `${LA_SO_CHI_TIET_CACHE_VER}:${LA_SO_CHI_TIET_PREVIEW_PROMPT_VER}`
      : LA_SO_CHI_TIET_CACHE_VER;
  }
  if (endpoint === "tieu-van") return TIEU_VAN_PROMPT_VER;
  if (endpoint === "luu-nien") {
    if (onlyLuuNienLife) {
      return `${LUU_NIEN_PROMPT_VER}:${LUU_NIEN_ONLY_LIFE_CACHE_VER}`;
    }
    if (onlyLuuNienCore) {
      return `${LUU_NIEN_PROMPT_VER}:${LUU_NIEN_ONLY_CORE_CACHE_VER}`;
    }
    return LUU_NIEN_PROMPT_VER;
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
  if (endpoint === "phong-thuy") return PHONG_THUY_SECTIONS_CACHE_VER;
  if (endpoint === "van-trinh-nam") return VAN_TRINH_NAM_PROMPT_VER;
  return "";
}
