/** Service-role calls from PayOS webhook / bazi-reading-prewarm. */
export function isServiceRoleBearer(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("Authorization");
  return Boolean(serviceKey && auth === `Bearer ${serviceKey}`);
}

export function prewarmUserIdFromBody(
  body: Record<string, unknown>,
): string | null {
  const id = body.prewarm_user_id;
  if (typeof id !== "string") return null;
  const t = id.trim();
  return t.length > 0 ? t : null;
}
