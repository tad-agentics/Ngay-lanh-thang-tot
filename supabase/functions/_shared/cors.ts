/**
 * CORS helpers for edge functions.
 *
 * Set ALLOWED_ORIGIN in Supabase secrets to the production app URL
 * (e.g. "https://ngaylanh.com"). Falls back to "*" when unset so local
 * development still works without extra configuration.
 *
 * Public endpoints (share-og, share-resolve) should use publicCorsHeaders
 * which always returns "*", since those URLs are opened by social-media bots
 * and third-party embeds that have no app origin.
 */

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

/** For authenticated / sensitive endpoints — restricted to the app origin. */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** For fully public endpoints (OG preview, share-resolve). */
export const publicCorsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
