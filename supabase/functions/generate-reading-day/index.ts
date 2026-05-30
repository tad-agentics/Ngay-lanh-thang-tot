/**
 * DeepSeek luận giải — ngày: ngay-hom-nay, day-detail, chon-ngay, chon-ngay-cards, hop-tuoi.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createDayGenerateReadingHandler } from "../_shared/generate-reading/run-day.ts";

Deno.serve(createDayGenerateReadingHandler());
