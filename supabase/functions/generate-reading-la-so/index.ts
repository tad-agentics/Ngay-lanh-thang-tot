/**
 * Gemini luận giải — lá số: la-so-chi-tiet, phong-thuy, la-so, dai-van.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GENERATE_READING_LA_SO_ENDPOINTS } from "../_shared/generate-reading/endpoints.ts";
import { createGenerateReadingHandler } from "../_shared/generate-reading/run.ts";

Deno.serve(createGenerateReadingHandler(GENERATE_READING_LA_SO_ENDPOINTS));
