/**
 * DeepSeek luận giải — lá số: la-so-chi-tiet, phong-thuy, la-so, dai-van.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createLaSoGenerateReadingHandler } from "../_shared/generate-reading/run-la-so.ts";

Deno.serve(createLaSoGenerateReadingHandler());
