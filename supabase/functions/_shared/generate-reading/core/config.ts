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
/** Legacy prose fallback — tiểu vận tháng. */
export const TIEU_VAN_TIMEOUT_MS = 22_000;
/** JSON draft / retry — tiểu vận tháng. */
export const TIEU_VAN_JSON_TIMEOUT_MS = 28_000;
/** Legacy prose fallback — lưu niên (vận năm). */
export const LUU_NIEN_TIMEOUT_MS = 22_000;
/** JSON nhịp năm 3 phần — lưu niên. */
export const LUU_NIEN_JSON_TIMEOUT_MS = 28_000;
/** @deprecated Use TIEU_VAN_TIMEOUT_MS or LUU_NIEN_TIMEOUT_MS */
export const TIEU_VAN_LUU_NIEN_TIMEOUT_MS = TIEU_VAN_TIMEOUT_MS;
/** @deprecated Use TIEU_VAN_JSON_TIMEOUT_MS or LUU_NIEN_JSON_TIMEOUT_MS */
export const TIEU_VAN_LUU_NIEN_JSON_TIMEOUT_MS = TIEU_VAN_JSON_TIMEOUT_MS;
/** Per-call ceiling for `la-so-chi-tiet` (clamped by edge budget). */
export const LA_SO_CHI_TIET_TIMEOUT_MS = 28_000;
export const DAY_DETAIL_REQUEST_TIMEOUT_MS = 40_000;

export const READING_MAX_TOKENS_DEFAULT = 512;
export const READING_MAX_TOKENS_INLINE_LICH_TO = 220;
export const READING_MAX_TOKENS_HOP_TUOI = 1_536;
export const READING_MAX_TOKENS_CHON_NGAY = 1_024;
export const READING_MAX_TOKENS_CHON_NGAY_CARDS = 2_048;
export const READING_MAX_TOKENS_DAY_DETAIL = 2_560;
/** Day-detail chat follow-up — đủ token, không thinking (tránh content rỗng). */
export const READING_MAX_TOKENS_DAY_DETAIL_FOLLOW_UP = 640;
export const READING_MAX_TOKENS_TIEU_VAN = 2048;
export const READING_MAX_TOKENS_TIEU_VAN_JSON = 4096;
export const READING_MAX_TOKENS_LUU_NIEN = 2048;
export const READING_MAX_TOKENS_LUU_NIEN_JSON = 4096;
/** @deprecated Use READING_MAX_TOKENS_TIEU_VAN or READING_MAX_TOKENS_LUU_NIEN */
export const READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN = READING_MAX_TOKENS_TIEU_VAN;
/** @deprecated Use READING_MAX_TOKENS_TIEU_VAN_JSON or READING_MAX_TOKENS_LUU_NIEN_JSON */
export const READING_MAX_TOKENS_TIEU_VAN_LUU_NIEN_JSON =
  READING_MAX_TOKENS_TIEU_VAN_JSON;
/** Paywall preview `menh_tong_quan` — pro model; cần đủ token cho JSON (không bị thinking ăn hết). */
export const READING_MAX_TOKENS_LA_SO_PREVIEW = 4_096;
/** §02 personality_readings — 4 mục × ~500–600 từ. */
export const READING_MAX_TOKENS_TINH_CACH_TRAITS = 12_288;

export const MIN_TIEU_VAN_SECTION_CHARS = 320;
export const MIN_TIEU_VAN_SECTION_SENTENCE_ENDS = 5;

export const MIN_MENH_PREVIEW_CHARS = 1000;
export const MIN_MENH_PREVIEW_SENTENCE_ENDS = 14;
export const MIN_MENH_PREVIEW_PARAGRAPHS = 3;

/** §02 mỗi personality_readings[].text — ~500 chữ, 2–3 đoạn (khớp §03 life areas). */
export const MIN_TINH_CACH_TRAIT_CHARS = 420;
export const MIN_TINH_CACH_TRAIT_PARAGRAPHS = 2;
export const MIN_TINH_CACH_TRAITS_REQUIRED = 2;
export const MIN_TINH_CACH_INTRO_CHARS = 120;

/** §03 mỗi life_area_readings[].text — ~500 chữ, đúng 3 đoạn. */
export const MIN_LUU_NIEN_LIFE_AREA_CHARS = 420;
export const MIN_LUU_NIEN_LIFE_AREA_PARAGRAPHS = 3;
export const READING_MAX_TOKENS_LUU_NIEN_LIFE_AREAS = 6_144;

/** §05 `ung_xu` — Quý nhân · lưu ý (màn 18). */
export const MIN_LUU_NIEN_UNG_XU_CHARS = 720;
export const MIN_LUU_NIEN_UNG_XU_PARAGRAPHS = 4;
export const MIN_LUU_NIEN_UNG_XU_CHARS_RELAXED = 560;
export const MIN_LUU_NIEN_UNG_XU_PARAGRAPHS_RELAXED = 3;

/** §04 mỗi khối hướng / màu / phi tinh. */
export const READING_MAX_TOKENS_PHONG_THUY_BLOCK = 4_096;
export const MIN_PHONG_THUY_HUONG_CHARS = 420;
export const MIN_PHONG_THUY_HUONG_PARAGRAPHS = 2;
export const MIN_PHONG_THUY_MAU_CHARS = 420;
export const MIN_PHONG_THUY_MAU_PARAGRAPHS = 2;
export const MIN_PHONG_THUY_PHI_TINH_CHARS = 720;
export const MIN_PHONG_THUY_PHI_TINH_PARAGRAPHS = 4;

export const TTL_MS: Record<string, number> = {
  "ngay-hom-nay": 24 * 60 * 60 * 1000,
  "chon-ngay": 24 * 60 * 60 * 1000,
  "chon-ngay-cards": 24 * 60 * 60 * 1000,
  "day-detail": 24 * 60 * 60 * 1000,
  "phong-thuy": 7 * 24 * 60 * 60 * 1000,
  "tieu-van": 7 * 24 * 60 * 60 * 1000,
  "luu-nien": 7 * 24 * 60 * 60 * 1000,
  "hop-tuoi": 7 * 24 * 60 * 60 * 1000,
  "tu-tru": 7 * 24 * 60 * 60 * 1000,
  "la-so": 7 * 24 * 60 * 60 * 1000,
  "la-so-chi-tiet": 7 * 24 * 60 * 60 * 1000,
};

export function ttlForEndpoint(endpoint: string): number {
  return TTL_MS[endpoint] ?? 24 * 60 * 60 * 1000;
}
