/**
 * DeepSeek luận giải — tiểu vận tháng: endpoint `tieu-van`.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createTieuVanGenerateReadingHandler } from "../_shared/generate-reading/run-tieu-van.ts";

Deno.serve(createTieuVanGenerateReadingHandler());
