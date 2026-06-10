import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  finalizeAskQuotaConsume,
  preflightDailyQuotaAvailable,
} from "./day-luan-daily-quota.ts";
import { hasOnboardingTrialAccess } from "./entitlements.ts";
import {
  readOnboardingTrialQuestionsMax,
  shouldConsumeTrialQuestion,
} from "./onboarding-trial.ts";
import { todayIsoVietnam } from "./generate-reading/core/dates.ts";
import { dailyLimited, trialExhausted } from "./generate-reading/core/response.ts";

type AdminClient = SupabaseClient;

/** Gate + consume for full `/luan-ai` day-detail anchor (not inline/teaser). */
export async function preflightDayDetailAnchorQuota(
  admin: AdminClient,
  userId: string,
  req: Request,
): Promise<
  | { ok: true; consumeTrial: boolean }
  | { ok: false; response: Response }
> {
  const { data: trialProfile } = await admin
    .from("profiles")
    .select("subscription_expires_at, onboarding_trial_questions_used")
    .eq("id", userId)
    .maybeSingle();

  const trialMax = await readOnboardingTrialQuestionsMax(admin);
  const consumeTrial = shouldConsumeTrialQuestion(trialProfile);
  if (consumeTrial && !hasOnboardingTrialAccess(trialProfile, trialMax)) {
    return { ok: false, response: trialExhausted(req) };
  }

  const vnToday = todayIsoVietnam();
  const dailyPreflight = await preflightDailyQuotaAvailable(
    admin,
    userId,
    vnToday,
  );
  if (!dailyPreflight.allowed) {
    return {
      ok: false,
      response: dailyLimited(req, dailyPreflight.count),
    };
  }

  return { ok: true, consumeTrial };
}

export async function consumeDayDetailAnchorQuota(
  admin: AdminClient,
  userId: string,
  consumeTrial: boolean,
  logContext: string,
): Promise<void> {
  const vnToday = todayIsoVietnam();
  await finalizeAskQuotaConsume(
    admin,
    userId,
    vnToday,
    consumeTrial,
    logContext,
  );
}
