/** Endpoints handled by `generate-reading-day`. */
export const GENERATE_READING_DAY_ENDPOINTS = new Set([
  "ngay-hom-nay",
  "day-detail",
  "chon-ngay",
  "chon-ngay-cards",
  "hop-tuoi",
]);

/** Endpoints handled by `generate-reading-la-so`. */
export const GENERATE_READING_LA_SO_ENDPOINTS = new Set([
  "la-so-chi-tiet",
  "phong-thuy",
  "la-so",
  "dai-van",
]);

/** Endpoints handled by `generate-reading-tieu-van`. */
export const GENERATE_READING_TIEU_VAN_ENDPOINTS = new Set([
  "tieu-van",
  "luu-nien",
]);

export const GENERATE_READING_ALL_ENDPOINTS = new Set([
  ...GENERATE_READING_DAY_ENDPOINTS,
  ...GENERATE_READING_LA_SO_ENDPOINTS,
  ...GENERATE_READING_TIEU_VAN_ENDPOINTS,
]);
