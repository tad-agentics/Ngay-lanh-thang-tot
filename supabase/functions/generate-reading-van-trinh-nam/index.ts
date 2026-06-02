/**
 * DeepSeek luận giải — Vận trình năm (lưu niên & lưu nguyệt).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createVanTrinhNamGenerateReadingHandler } from "../_shared/generate-reading/run-van-trinh-nam.ts";

Deno.serve(createVanTrinhNamGenerateReadingHandler());
