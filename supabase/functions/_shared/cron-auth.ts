/** Cron / ops endpoints — fail closed in production when CRON_SECRET unset. */

function isLocalSupabase(): boolean {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  return (
    url.includes("127.0.0.1") ||
    url.includes("localhost") ||
    url.includes("kong:8000")
  );
}

export function verifyCronAuth(req: Request): boolean {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    return isLocalSupabase();
  }
  const h = req.headers.get("Authorization");
  const token = h?.startsWith("Bearer ") ? h.slice(7).trim() : null;
  return token === secret;
}
