/**
 * Onboarding trial questions — never-sub users get N app-wide asks (tra cứu + follow-ups).
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
  type ProfileTrialEntitlements,
  canUseCalendar,
  hasOnboardingTrialAccess,
  isCalendarTeaserEligible,
  isNeverSubscribedUser,
} from "./entitlements.ts";

export type TrialGateProfile = ProfileTrialEntitlements;

export type ConsumeTrialResult = {
  used: number;
  remaining: number;
  limited: boolean;
};

let cachedTrialMax: number | null = null;

export async function readOnboardingTrialQuestionsMax(
  admin: SupabaseClient,
): Promise<number> {
  if (cachedTrialMax != null) return cachedTrialMax;
  const { data } = await admin
    .from("app_config")
    .select("value")
    .eq("config_key", "onboarding_trial_questions_max")
    .maybeSingle();
  const n = data?.value != null ? Number.parseInt(String(data.value), 10) : NaN;
  cachedTrialMax =
    Number.isFinite(n) && n > 0 ? n : DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX;
  return cachedTrialMax;
}

export async function consumeOnboardingTrialQuestion(
  admin: SupabaseClient,
  userId: string,
): Promise<ConsumeTrialResult> {
  const { data, error } = await admin.rpc("increment_onboarding_trial_question", {
    p_user: userId,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    console.error("increment_onboarding_trial_question", error?.message);
    return { used: 0, remaining: 0, limited: true };
  }
  const rec = data as Record<string, unknown>;
  const used =
    typeof rec.used === "number" && Number.isFinite(rec.used) ? rec.used : 0;
  const remaining =
    typeof rec.remaining === "number" && Number.isFinite(rec.remaining)
      ? rec.remaining
      : 0;
  return { used, remaining, limited: rec.limited === true };
}

/** After a successful trial ask — log when RPC did not increment (race / at cap). */
export async function finalizeOnboardingTrialConsume(
  admin: SupabaseClient,
  userId: string,
  consumeTrial: boolean,
  logContext: string,
): Promise<ConsumeTrialResult | null> {
  if (!consumeTrial) return null;
  const result = await consumeOnboardingTrialQuestion(admin, userId);
  if (result.limited) {
    console.warn(`onboarding_trial_consume_limited:${logContext}`, {
      userId,
      used: result.used,
      remaining: result.remaining,
    });
  }
  return result;
}

/** Tra cứu pick / paid calendar API — not today-only teaser. */
export function profileAllowsTraCuuOrPaidCalendar(
  profile: TrialGateProfile | null | undefined,
  max = DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
): boolean {
  if (!profile) return false;
  if (canUseCalendar(profile)) return true;
  return hasOnboardingTrialAccess(profile, max);
}

/**
 * Personalized calendar ops: sub, trial, or teaser (today-only for never-sub w/o trial).
 */
export function profilePassesCalendarGate(
  profile: TrialGateProfile | null | undefined,
  dayIso: string | null | undefined,
  todayIso: string,
  max = DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX,
): boolean {
  if (!profile) return false;
  if (canUseCalendar(profile)) return true;
  if (hasOnboardingTrialAccess(profile, max)) return true;
  if (!isCalendarTeaserEligible(profile)) return false;
  if (!dayIso) return true;
  return dayIso === todayIso;
}

export function shouldConsumeTrialQuestion(
  profile: TrialGateProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return isNeverSubscribedUser(profile) && !canUseCalendar(profile);
}
