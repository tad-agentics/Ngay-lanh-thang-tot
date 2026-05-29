/**
 * @deprecated Use generate-reading-day | generate-reading-la-so | generate-reading-tieu-van.
 * Kept for backward compatibility — accepts all endpoints (no domain filter).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createGenerateReadingHandler } from "../_shared/generate-reading/run.ts";

Deno.serve(createGenerateReadingHandler(null));
