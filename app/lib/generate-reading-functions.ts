/** Must stay aligned with `supabase/functions/_shared/generate-reading/endpoints.ts`. */

const GENERATE_READING_DAY_ENDPOINTS = new Set([
  "ngay-hom-nay",
  "day-detail",
  "chon-ngay",
  "chon-ngay-cards",
  "hop-tuoi",
]);

const GENERATE_READING_LA_SO_ENDPOINTS = new Set([
  "la-so-chi-tiet",
  "phong-thuy",
  "la-so",
  "dai-van",
]);

/** Vận tháng — màn Luận tiểu vận. */
const GENERATE_READING_TIEU_VAN_ENDPOINTS = new Set(["tieu-van"]);

/** Vận năm (lưu niên) — §03 Luận Bát Tự. */
const GENERATE_READING_LUU_NIEN_ENDPOINTS = new Set(["luu-nien"]);

export type GenerateReadingEdgeFunction =
  | "generate-reading-day"
  | "generate-reading-la-so"
  | "generate-reading-tieu-van"
  | "generate-reading-luu-nien";

/** Route `endpoint` to the domain-specific Edge Function. */
export function generateReadingFunctionName(
  endpoint: string,
): GenerateReadingEdgeFunction {
  if (GENERATE_READING_DAY_ENDPOINTS.has(endpoint)) {
    return "generate-reading-day";
  }
  if (GENERATE_READING_LA_SO_ENDPOINTS.has(endpoint)) {
    return "generate-reading-la-so";
  }
  if (GENERATE_READING_TIEU_VAN_ENDPOINTS.has(endpoint)) {
    return "generate-reading-tieu-van";
  }
  if (GENERATE_READING_LUU_NIEN_ENDPOINTS.has(endpoint)) {
    return "generate-reading-luu-nien";
  }
  throw new Error(`Unknown generate-reading endpoint: ${endpoint}`);
}
