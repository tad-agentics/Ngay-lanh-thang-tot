import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { MAX_DAY_LUAN_FOLLOW_UPS } from "./day-luan-thread.ts";
import { finalizeOnboardingTrialConsume } from "./onboarding-trial.ts";

export type AdminClient = ReturnType<typeof createClient>;

export type AskQuotaConsumeResult = {
  dailyCount: number;
  dailyLimited: boolean;
};

export async function fetchDailyCount(
  admin: AdminClient,
  userId: string,
  vnDate: string,
): Promise<number> {
  const { data, error } = await admin.rpc("get_day_luan_daily_count", {
    p_user: userId,
    p_vn_date: vnDate,
  });
  if (error) {
    console.error("get_day_luan_daily_count", error.message);
    return 0;
  }
  return typeof data === "number" && Number.isFinite(data) ? data : 0;
}

export async function tryIncrementDaily(
  admin: AdminClient,
  userId: string,
  vnDate: string,
): Promise<{ count: number; limited: boolean }> {
  const { data, error } = await admin.rpc("increment_day_luan_daily", {
    p_user: userId,
    p_vn_date: vnDate,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    console.error("increment_day_luan_daily", error?.message);
    const count = await fetchDailyCount(admin, userId, vnDate);
    return { count, limited: true };
  }
  const rec = data as Record<string, unknown>;
  const count =
    typeof rec.count === "number" && Number.isFinite(rec.count) ? rec.count : 0;
  return { count, limited: rec.limited === true };
}

/** Peek before LLM — does not reserve a slot. */
export async function preflightDailyQuotaAvailable(
  admin: AdminClient,
  userId: string,
  vnDate: string,
): Promise<{ allowed: true } | { allowed: false; count: number }> {
  const count = await fetchDailyCount(admin, userId, vnDate);
  if (count >= MAX_DAY_LUAN_FOLLOW_UPS) {
    return { allowed: false, count };
  }
  return { allowed: true };
}

/** After a delivered answer — daily + onboarding-trial counters stay aligned. */
export async function finalizeAskQuotaConsume(
  admin: AdminClient,
  userId: string,
  vnDate: string,
  consumeTrial: boolean,
  logContext: string,
): Promise<AskQuotaConsumeResult> {
  const inc = await tryIncrementDaily(admin, userId, vnDate);
  await finalizeOnboardingTrialConsume(
    admin,
    userId,
    consumeTrial,
    logContext,
  );
  if (inc.limited) {
    console.warn(`day_luan_daily_consume_limited:${logContext}`, {
      userId,
      count: inc.count,
    });
  }
  return { dailyCount: inc.count, dailyLimited: inc.limited };
}

/** Undo a reserved slot when the ask did not produce an answer. */
export async function refundDailyQuota(
  admin: AdminClient,
  userId: string,
  vnDate: string,
): Promise<void> {
  const { error } = await admin.rpc("decrement_day_luan_daily", {
    p_user: userId,
    p_vn_date: vnDate,
  });
  if (error) {
    console.error("decrement_day_luan_daily", error.message);
  }
}
