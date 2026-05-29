/**
 * Gemini luận giải — tiểu vận / lưu niên: tieu-van, luu-nien.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GENERATE_READING_TIEU_VAN_ENDPOINTS } from "../_shared/generate-reading/endpoints.ts";
import { createGenerateReadingHandler } from "../_shared/generate-reading/run.ts";

Deno.serve(createGenerateReadingHandler(GENERATE_READING_TIEU_VAN_ENDPOINTS));
