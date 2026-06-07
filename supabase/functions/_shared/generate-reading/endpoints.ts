/** Endpoints handled by `generate-reading-day`. */
export const GENERATE_READING_DAY_ENDPOINTS = new Set([
  "ngay-hom-nay",
  "day-detail",
  "chon-ngay",
  "chon-ngay-cards",
  "hop-tuoi",
]);

/** Edge `generate-reading-la-so` — tất cả endpoint dùng v4-flash (không thinking). */
export const GENERATE_READING_LA_SO_ENDPOINTS = new Set([
  "la-so-chi-tiet",
  "phong-thuy",
  "la-so",
  "dai-van",
]);

/** Endpoints handled by `generate-reading-tieu-van` (vận tháng). */
export const GENERATE_READING_TIEU_VAN_ENDPOINTS = new Set(["tieu-van"]);

/** Endpoints handled by `generate-reading-luu-nien` (vận năm / §03 Bát Tự). */
export const GENERATE_READING_LUU_NIEN_ENDPOINTS = new Set(["luu-nien"]);

/** Endpoints handled by `generate-reading-van-trinh-nam` (lưu niên & lưu nguyệt). */
export const GENERATE_READING_VAN_TRINH_NAM_ENDPOINTS = new Set([
  "van-trinh-nam",
]);

export const GENERATE_READING_ALL_ENDPOINTS = new Set([
  ...GENERATE_READING_DAY_ENDPOINTS,
  ...GENERATE_READING_LA_SO_ENDPOINTS,
  ...GENERATE_READING_TIEU_VAN_ENDPOINTS,
  ...GENERATE_READING_LUU_NIEN_ENDPOINTS,
  ...GENERATE_READING_VAN_TRINH_NAM_ENDPOINTS,
]);
