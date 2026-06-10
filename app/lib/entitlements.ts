import type { Profile } from "~/lib/profile-context";
import {
  type ProfileEntitlements,
  type ProfileTrialEntitlements,
  DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
  canAccessPaidCalendar as coreCanAccessPaidCalendar,
  canUseBaziReading as coreCanUseBaziReading,
  canUseCalendar as coreCanUseCalendar,
  canUseTieuVanReading as coreCanUseTieuVanReading,
  hasOnboardingTrialAccess as coreHasOnboardingTrialAccess,
  isCalendarTeaserEligible as coreIsCalendarTeaserEligible,
  isNeverSubscribedUser as coreIsNeverSubscribedUser,
  isSubscriptionLapsed as coreIsSubscriptionLapsed,
  onboardingTrialQuestionsRemaining as coreOnboardingTrialQuestionsRemaining,
  subscriptionActive,
} from "../../shared/entitlements-core.ts";

export { subscriptionActive, DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX };
export type { ProfileEntitlements, ProfileTrialEntitlements };
export type EntitlementProfile = ProfileEntitlements;

export function canUseCalendar(
  profile: EntitlementProfile | null | undefined,
): boolean {
  return coreCanUseCalendar(profile);
}

export function hasOnboardingTrialAccess(
  profile: ProfileTrialEntitlements | null | undefined,
): boolean {
  return coreHasOnboardingTrialAccess(profile);
}

/** Never-sub đã dùng hết pool onboarding trial chat. */
export function isOnboardingTrialExhausted(
  profile: ProfileTrialEntitlements | null | undefined,
): boolean {
  if (!profile || !coreIsNeverSubscribedUser(profile)) return false;
  return !coreHasOnboardingTrialAccess(profile);
}

export function onboardingTrialQuestionsRemaining(
  profile: ProfileTrialEntitlements | null | undefined,
): number {
  return coreOnboardingTrialQuestionsRemaining(profile);
}

/** Subscription or never-sub onboarding trial — unlocks tra cứu + full lịch browse. */
export function canAccessPaidCalendar(
  profile: ProfileTrialEntitlements | null | undefined,
): boolean {
  return coreCanAccessPaidCalendar(profile);
}

/** Shared chat UI: cap daily pool by lifetime trial turns for never-sub users. */
export function effectiveChatQuotaRemaining(
  profile: ProfileTrialEntitlements | null | undefined,
  dailyRemaining: number,
): number {
  if (!profile) return dailyRemaining;
  if (coreIsNeverSubscribedUser(profile)) {
    const trialRem = coreOnboardingTrialQuestionsRemaining(profile);
    if (trialRem > 0) return Math.min(dailyRemaining, trialRem);
    return 0;
  }
  return dailyRemaining;
}

export function isOnboardingTrialChatMode(
  profile: ProfileTrialEntitlements | null | undefined,
): boolean {
  return coreHasOnboardingTrialAccess(profile);
}

export function isNeverSubscribedUser(
  profile: EntitlementProfile | null | undefined,
): boolean {
  return coreIsNeverSubscribedUser(profile);
}

export function isSubscriptionLapsed(
  profile: EntitlementProfile | null | undefined,
): boolean {
  return coreIsSubscriptionLapsed(profile);
}

/** @deprecated Use `isCalendarTeaserEligible` — never-sub only; product treats lapsed the same. */
export function isNewUserDayLuanTeaser(
  profile: EntitlementProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return isNeverSubscribedUser(profile) && !canUseCalendar(profile);
}

export function isCalendarTeaserEligible(
  profile: EntitlementProfile | null | undefined,
): boolean {
  return coreIsCalendarTeaserEligible(profile);
}

/** @deprecated Use `canPeekTodayLuanReading` — never-sub on today only. */
export function neverSubFreeDayReading(
  profile: EntitlementProfile | null | undefined,
  dayIso: string,
  todayIso: string,
): boolean {
  if (!profile || !dayIso || !todayIso) return false;
  return isNewUserDayLuanTeaser(profile) && dayIso === todayIso;
}

/** Hôm nay: user chưa có gói lịch (never-sub + lapsed) xem luận full trên `/luan-ai/day-*`. */
export function canPeekTodayLuanReading(
  profile: EntitlementProfile | null | undefined,
  dayIso: string,
  todayIso: string,
): boolean {
  if (!profile || !dayIso || !todayIso || dayIso !== todayIso) return false;
  return isCalendarTeaserEligible(profile);
}

export function canUseBaziReading(
  profile: EntitlementProfile | null | undefined,
): boolean {
  return coreCanUseBaziReading(profile);
}

export function canUseTieuVanReading(
  profile: EntitlementProfile | null | undefined,
): boolean {
  return coreCanUseTieuVanReading(profile);
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

/** Whole days until subscription_expires_at (ICT calendar day diff). Null if inactive. */
export function subscriptionDaysUntil(
  expires: string | null | undefined,
): number | null {
  if (!expires || !subscriptionActive(expires)) return null;
  const end = new Date(expires);
  const now = new Date();
  end.setHours(12, 0, 0, 0);
  now.setHours(12, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

/** G2 — amber urgency on Tab Tôi / lịch when ≤7 days remain. */
export function subscriptionExpiryUrgent(
  expires: string | null | undefined,
): boolean {
  const days = subscriptionDaysUntil(expires);
  return days != null && days <= 7;
}

export function hasYearlySubscription(
  profile: EntitlementProfile | null | undefined,
): boolean {
  if (!profile) return false;
  if (!subscriptionActive(profile.subscription_expires_at)) return false;
  const exp = new Date(profile.subscription_expires_at!);
  const months = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  return months >= 11;
}
