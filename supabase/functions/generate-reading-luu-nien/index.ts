/**
 * DeepSeek luận giải — lưu niên (vận năm): endpoint `luu-nien`.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createLuuNienGenerateReadingHandler } from "../_shared/generate-reading/run-luu-nien.ts";

Deno.serve(createLuuNienGenerateReadingHandler());
