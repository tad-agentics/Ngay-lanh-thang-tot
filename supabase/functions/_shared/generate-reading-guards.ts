/**
 * Pre-LLM guards for generate-reading: credit preflight + Upstash rate limit.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  inPivotCreditTransition,
  readPivotTransitionUntil,
} from "./entitlements.ts";
import { redisGetString, redisSetNxEx } from "./redis-cache.ts";

const AI_READING_UNLOCK_FEATURE_KEY = "ai_reading_unlock";
const RATE_LIMIT_WINDOW_SEC = 10;

export type GenerateReadingPreflight =
  | { allowed: true }
  | {
    allowed: false;
    reason: "profile_missing" | "sub_expired" | "insufficient_credits" | "not_unlocked";
  };

export function subscriptionActiveForReading(expires: string | null): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}

/** Mirrors reading-unlock + balance check before spending on LLM. */
export async function preflightAiReadingAccess(
  admin: SupabaseClient,
  userId: string,
  scope: "home" | "day_detail",
  dayIso: string,
): Promise<GenerateReadingPreflight> {
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("credits_balance, subscription_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (pErr || !profile) {
    return { allowed: false, reason: "profile_missing" };
  }

  if (
    subscriptionActiveForReading(
      profile.subscription_expires_at as string | null,
    )
  ) {
    return { allowed: true };
  }

  const pivotUntil = await readPivotTransitionUntil(admin);
  if (!inPivotCreditTransition(pivotUntil)) {
    return { allowed: false, reason: "sub_expired" };
  }

  const idempotencyKey = `ai_reading_unlock:${userId}:${scope}:${dayIso}`;
  const { data: existing } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) return { allowed: true };

  const { data: costRow } = await admin
    .from("feature_credit_costs")
    .select("credit_cost, is_free")
    .eq("feature_key", AI_READING_UNLOCK_FEATURE_KEY)
    .maybeSingle();

  const cost =
    costRow && !costRow.is_free && (costRow.credit_cost as number) > 0
      ? (costRow.credit_cost as number)
      : 0;

  if (cost <= 0) return { allowed: true };

  const balance = profile.credits_balance as number;
  if (balance < cost) {
    return { allowed: false, reason: "insufficient_credits" };
  }

  return { allowed: false, reason: "not_unlocked" };
}

/**
 * Fixed window: at most one generate-reading LLM path per user per 10s.
 * @returns true when the caller may proceed (slot acquired or Redis unavailable).
 */
export async function acquireGenerateReadingRateLimit(
  userId: string,
): Promise<boolean> {
  const key = `gen_reading_rl:v1:${userId}`;
  const acquired = await redisSetNxEx(key, "1", RATE_LIMIT_WINDOW_SEC);
  if (acquired) return true;
  const held = await redisGetString(key);
  return held == null;
}
