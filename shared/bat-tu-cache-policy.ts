/**
 * bat-tu Redis cache policy — pure (no Deno.env).
 */

export const ANONYMOUS_OPS = new Set([
  "ngay-hom-nay",
  "weekly-summary",
  "convert-date",
  "lich-thang",
  "day-detail",
]);

export const CALENDAR_GATE_OPS = new Set([
  "ngay-hom-nay",
  "lich-thang",
  "day-detail",
  "day-luan-context",
  "day-compare",
]);

export function bodyHasBirthDate(body: Record<string, unknown>): boolean {
  const v = body.birth_date;
  return v != null && String(v).trim() !== "";
}

/** Personalized calendar — requires entitlement before cache read. */
export function isPersonalizedCalendarBody(
  op: string,
  body: Record<string, unknown>,
): boolean {
  if (!CALENDAR_GATE_OPS.has(op)) return false;
  if (!bodyHasBirthDate(body)) return false;
  if (op === "day-detail") {
    const mode = String(body.mode ?? "").toLowerCase();
    if (mode === "generic") return false;
  }
  return true;
}
