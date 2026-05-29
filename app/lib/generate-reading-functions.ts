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

const GENERATE_READING_TIEU_VAN_ENDPOINTS = new Set([
  "tieu-van",
  "luu-nien",
]);

export type GenerateReadingEdgeFunction =
  | "generate-reading-day"
  | "generate-reading-la-so"
  | "generate-reading-tieu-van"
  | "generate-reading";

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
  return "generate-reading";
}
