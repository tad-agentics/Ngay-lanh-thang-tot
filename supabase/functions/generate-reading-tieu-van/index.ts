/**
 * DeepSeek luận giải — tiểu vận / lưu niên: tieu-van, luu-nien.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createTieuVanGenerateReadingHandler } from "../_shared/generate-reading/run-tieu-van.ts";

Deno.serve(createTieuVanGenerateReadingHandler());
