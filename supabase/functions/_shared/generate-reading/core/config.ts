export const MAX_BODY_CHARS = 180_000;

/** Hôm nay, ngày khác, chọn ngày, hợp tuổi, phong-thuy, la-so, dai-van, … */
export const DEFAULT_LLM_MODEL = "deepseek-v4-flash";
/** Chỉ `la-so-chi-tiet` (Bát Tự năm) + `tieu-van` / `luu-nien`. */
export const DEFAULT_LLM_MODEL_PRO = "deepseek-v4-pro";
export const DEEPSEEK_API_BASE = "https://api.deepseek.com";

export const REQUEST_TIMEOUT_MS = 25_000;
export const HOP_TUOI_REQUEST_TIMEOUT_MS = 35_000;
export const CHON_NGAY_REQUEST_TIMEOUT_MS = 30_000;
export const CHON_NGAY_CARDS_REQUEST_TIMEOUT_MS = 40_000;
export const TIEU_VAN_LUU_NIEN_TIMEOUT_MS = 40_000;
export const TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS = 55_000;
export const LA_SO_CHI_TIET_TIMEOUT_MS = 45_000;
export const DAY_DETAIL_REQUEST_TIMEOUT_MS = 40_000;

export const READING_MAX_TOKENS_DEFAULT = 512;
export const READING_MAX_TOKENS_INLINE_LICH_TO = 220;
export const READING_MAX_TOKENS_HOP_TUOI = 1_536;
export const READING_MAX_TOKENS_CHON_NGAY = 1_024;
export const READING_MAX_TOKENS_CHON_NGAY_CARDS = 2_048;
export const READING_MAX_TOKENS_DAY_DETAIL = 2_560;
export const READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN = 2048;
export const READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON = 4096;

export const MIN_TIEU_VAN_SECTION_CHARS = 320;
export const MIN_TIEU_VAN_SECTION_SENTENCE_ENDS = 5;

export const MIN_MENH_PREVIEW_CHARS = 400;
export const MIN_MENH_PREVIEW_SENTENCE_ENDS = 5;

export const TTL_MS: Record<string, number> = {
  "ngay-hom-nay": 24 * 60 * 60 * 1000,
  "chon-ngay": 24 * 60 * 60 * 1000,
  "chon-ngay-cards": 24 * 60 * 60 * 1000,
  "day-detail": 24 * 60 * 60 * 1000,
  "phong-thuy": 7 * 24 * 60 * 60 * 1000,
  "tieu-van": 7 * 24 * 60 * 60 * 1000,
  "hop-tuoi": 7 * 24 * 60 * 60 * 1000,
  "tu-tru": 7 * 24 * 60 * 60 * 1000,
  "la-so": 7 * 24 * 60 * 60 * 1000,
  "la-so-chi-tiet": 7 * 24 * 60 * 60 * 1000,
};

export function ttlForEndpoint(endpoint: string): number {
  return TTL_MS[endpoint] ?? 24 * 60 * 60 * 1000;
}
