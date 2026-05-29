/**
 * Gemini luận giải — ngày: ngay-hom-nay, day-detail, chon-ngay, chon-ngay-cards, hop-tuoi.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GENERATE_READING_DAY_ENDPOINTS } from "../_shared/generate-reading/endpoints.ts";
import { createGenerateReadingHandler } from "../_shared/generate-reading/run.ts";

Deno.serve(createGenerateReadingHandler(GENERATE_READING_DAY_ENDPOINTS));
