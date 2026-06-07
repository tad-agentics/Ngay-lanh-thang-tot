/** Direction C entitlement helpers — shared by bat-tu, generate-reading, payos-webhook. */

export {
  type ProfileEntitlements,
  type ProfileTrialEntitlements,
  DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
  applyYearlyBundleLuận,
  canAccessPaidCalendar,
  canUseBaziReading,
  canUseCalendar,
  canUseTieuVanReading,
  extendSubscriptionMonths,
  hasOnboardingTrialAccess,
  isCalendarTeaserEligible,
  isNeverSubscribedUser,
  isSubscriptionLapsed,
  onboardingTrialQuestionsRemaining,
  onboardingTrialQuestionsUsed,
  subscriptionActive,
} from "../../../shared/entitlements-core.ts";

/** NLTT-only body flag on Tab Tra cứu `bat-tu` ops — REQ-NLTT-01; never forwarded upstream. */
export const BAT_TU_SOURCE_TRA_CUU = "tra_cuu";

export function isTraCuuPickChonNgay(
  op: string,
  body: Record<string, unknown>,
): boolean {
  if (String(body.source ?? "").toLowerCase() !== BAT_TU_SOURCE_TRA_CUU) {
    return false;
  }
  return op === "chon-ngay" || op === "hop-tuoi";
}
