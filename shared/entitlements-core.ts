/**
 * Core entitlement logic — shared by app and Edge (no Deno/browser APIs).
 */

export type ProfileEntitlements = {
  subscription_expires_at: string | null;
  bazi_reading_unlocked_at: string | null;
  tieu_van_reading_expires_at: string | null;
};

export type ProfileTrialEntitlements = ProfileEntitlements & {
  onboarding_trial_questions_used?: number | null;
};

/** Default when `app_config.onboarding_trial_questions_max` is unset. */
export const DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX = 5;

export function subscriptionActive(
  expires: string | null | undefined,
): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}

export function canUseCalendar(
  profile: ProfileEntitlements | null | undefined,
): boolean {
  if (!profile) return false;
  return subscriptionActive(profile.subscription_expires_at);
}

export function isNeverSubscribedUser(
  profile: ProfileEntitlements | null | undefined,
): boolean {
  if (!profile) return false;
  return profile.subscription_expires_at == null;
}

export function isSubscriptionLapsed(
  profile: ProfileEntitlements | null | undefined,
): boolean {
  if (!profile) return false;
  return (
    profile.subscription_expires_at != null &&
    !subscriptionActive(profile.subscription_expires_at)
  );
}

export function isCalendarTeaserEligible(
  profile: ProfileEntitlements | null | undefined,
): boolean {
  if (!profile) return false;
  return isNeverSubscribedUser(profile) || isSubscriptionLapsed(profile);
}

export function onboardingTrialQuestionsUsed(
  profile: ProfileTrialEntitlements | null | undefined,
): number {
  const raw = profile?.onboarding_trial_questions_used ?? 0;
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0
    ? Math.floor(raw)
    : 0;
}

export function onboardingTrialQuestionsRemaining(
  profile: ProfileTrialEntitlements | null | undefined,
  max = DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
): number {
  if (!profile || !isNeverSubscribedUser(profile)) return 0;
  const cap = max > 0 ? max : DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX;
  return Math.max(0, cap - onboardingTrialQuestionsUsed(profile));
}

/** Never-sub with free chat turns left — unlocks chat + tra cứu until exhausted. */
export function hasOnboardingTrialAccess(
  profile: ProfileTrialEntitlements | null | undefined,
  max = DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
): boolean {
  return onboardingTrialQuestionsRemaining(profile, max) > 0;
}

/** Active subscription or onboarding trial (never-sub only). */
export function canAccessPaidCalendar(
  profile: ProfileTrialEntitlements | null | undefined,
  max = DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
): boolean {
  if (!profile) return false;
  return canUseCalendar(profile) || hasOnboardingTrialAccess(profile, max);
}

function hasYearlySub(profile: ProfileEntitlements): boolean {
  if (!subscriptionActive(profile.subscription_expires_at)) return false;
  const exp = new Date(profile.subscription_expires_at!);
  const months = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  return months >= 11;
}

export function canUseBaziReading(
  profile: ProfileEntitlements | null | undefined,
): boolean {
  if (!profile) return false;
  if (hasYearlySub(profile)) return true;
  return profile.bazi_reading_unlocked_at != null;
}

export function canUseTieuVanReading(
  profile: ProfileEntitlements | null | undefined,
): boolean {
  if (!profile) return false;
  if (hasYearlySub(profile)) return true;
  if (!profile.tieu_van_reading_expires_at) return false;
  return new Date(profile.tieu_van_reading_expires_at) > new Date();
}

export function extendSubscriptionMonths(
  currentExpires: string | null,
  months: number,
): string {
  const now = new Date();
  const current = currentExpires ? new Date(currentExpires) : null;
  const base = current && current > now ? current : now;
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next.toISOString();
}

export function applyYearlyBundleLuận(profile: ProfileEntitlements): {
  bazi_reading_unlocked_at: string;
  tieu_van_reading_expires_at: string;
} {
  const now = new Date().toISOString();
  const tieuBase = profile.tieu_van_reading_expires_at
    ? new Date(profile.tieu_van_reading_expires_at)
    : new Date();
  const tieuFrom = tieuBase > new Date() ? tieuBase : new Date();
  const tieuNext = new Date(tieuFrom);
  tieuNext.setFullYear(tieuNext.getFullYear() + 1);
  return {
    bazi_reading_unlocked_at: profile.bazi_reading_unlocked_at ?? now,
    tieu_van_reading_expires_at: tieuNext.toISOString(),
  };
}
