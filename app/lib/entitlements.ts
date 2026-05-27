import type { Profile } from "~/lib/profile-context";

export function subscriptionActive(
  expires: string | null | undefined,
): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}

/** Legacy credit window after Direction C pivot (`app_config.pivot_transition_until`). */
export function inPivotCreditTransition(
  pivotUntilIso: string | null | undefined,
): boolean {
  if (!pivotUntilIso) return false;
  const d = new Date(pivotUntilIso);
  return !Number.isNaN(d.getTime()) && d > new Date();
}

export type EntitlementProfile = Pick<
  Profile,
  | "subscription_expires_at"
  | "bazi_reading_unlocked_at"
  | "tieu_van_reading_expires_at"
  | "credits_balance"
>;

export function canUseCalendar(
  profile: EntitlementProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return subscriptionActive(profile.subscription_expires_at);
}

function hasYearlySub(profile: EntitlementProfile): boolean {
  if (!subscriptionActive(profile.subscription_expires_at)) return false;
  const exp = new Date(profile.subscription_expires_at!);
  const months = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  return months >= 11;
}

export function canUseBaziReading(
  profile: EntitlementProfile | null | undefined,
): boolean {
  if (!profile) return false;
  if (hasYearlySub(profile)) return true;
  return profile.bazi_reading_unlocked_at != null;
}

export function canUseTieuVanReading(
  profile: EntitlementProfile | null | undefined,
): boolean {
  if (!profile) return false;
  if (hasYearlySub(profile)) return true;
  if (!profile.tieu_van_reading_expires_at) return false;
  return new Date(profile.tieu_van_reading_expires_at) > new Date();
}

/** DD.MM.YYYY in Asia/Ho_Chi_Minh — no time component (Direction C N2). */
export function formatSubscriptionExpiry(
  iso: string | null | undefined,
): string | null {
  if (!iso || !subscriptionActive(iso)) return null;
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `${day}.${month}.${year}`;
}

export function subscriptionStatusLine(
  profile: EntitlementProfile | null | undefined,
): string | null {
  const exp = formatSubscriptionExpiry(profile?.subscription_expires_at);
  if (!exp) return null;
  return `Lịch của bạn dùng đến ${exp}`;
}
