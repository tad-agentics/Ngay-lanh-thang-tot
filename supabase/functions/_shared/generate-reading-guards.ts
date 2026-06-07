/**
 * Pre-LLM guards for generate-reading: subscription + prior unlock ledger.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { isCalendarTeaserEligible } from "./entitlements.ts";
import { todayIsoVietnam } from "./generate-reading/core/dates.ts";
import { redisGetString, redisRestConfigured, redisSetNxEx } from "./redis-cache.ts";

const AI_READING_UNLOCK_FEATURE_KEY = "ai_reading_unlock";
const RATE_LIMIT_WINDOW_SEC = 10;
const FOLLOW_UP_RATE_LIMIT_WINDOW_SEC = 2;

export type GenerateReadingPreflight =
  | { allowed: true }
  | {
    allowed: false;
    reason: "profile_missing" | "sub_expired" | "not_unlocked";
  };

export function subscriptionActiveForReading(expires: string | null): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}

/** Subscription active or user already unlocked this scope/day via reading-unlock. */
export async function preflightAiReadingAccess(
  admin: SupabaseClient,
  userId: string,
  scope: "home" | "day_detail",
  dayIso: string,
): Promise<GenerateReadingPreflight> {
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("subscription_expires_at")
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

  // Wow-moment: never-sub / lapsed get full day-detail anchor on today only (`/luan-ai`).
  if (
    scope === "day_detail" &&
    dayIso === todayIsoVietnam() &&
    isCalendarTeaserEligible(profile)
  ) {
    return { allowed: true };
  }

  const idempotencyKey = `ai_reading_unlock:${userId}:${scope}:${dayIso}`;
  const { data: existing } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) return { allowed: true };

  return { allowed: false, reason: "sub_expired" };
}

/** Một scope / cửa sổ — Bát Tự bundle gọi song song la-so + luu-life + luu-core + phong-thuy. */
export function generateReadingRateLimitScope(
  endpoint: string,
  opts?: {
    preview?: boolean;
    onlyTinhCach?: boolean;
    onlyLuuNienLife?: boolean;
    onlyLuuNienCore?: boolean;
    /** `inline` | `teaser` | `full` — tránh inline lịch tờ chặn anchor `/luan-ai`. */
    variant?: string;
    followUp?: boolean;
  },
): string {
  if (opts?.preview) return `${endpoint}:preview`;
  if (opts?.onlyTinhCach) return `${endpoint}:only-tinh-cach`;
  if (opts?.onlyLuuNienLife) return `${endpoint}:only-luu-life`;
  if (opts?.onlyLuuNienCore) return `${endpoint}:only-luu-core`;
  if (endpoint === "day-detail" || endpoint === "ngay-hom-nay") {
    const v = opts?.followUp
      ? "follow-up"
      : (opts?.variant?.trim() || "full");
    return `${endpoint}:${v}`;
  }
  return endpoint;
}

/**
 * Fixed window: at most one generate-reading LLM path per user per window.
 * Follow-ups use a separate key so the initial day luận does not block chat 10s.
 * @returns true when the caller may proceed (slot acquired).
 * Blocks only when the slot is confirmed held. If the SET fails for any other
 * reason (Redis error/outage) and the key is not actually present, fail open —
 * a transient Redis fault must never hard-block every paid reading.
 */
export async function acquireGenerateReadingRateLimit(
  userId: string,
  opts?: { followUp?: boolean; /** Per-endpoint/subset — Bát Tự bundle gọi song song. */ scope?: string },
): Promise<boolean> {
  if (!redisRestConfigured()) return true;

  const followUp = opts?.followUp === true;
  const scope = (opts?.scope ?? "default").trim() || "default";
  const key = followUp
    ? `gen_reading_rl_followup:v1:${userId}:${scope}`
    : `gen_reading_rl:v1:${userId}:${scope}`;
  const windowSec = followUp
    ? FOLLOW_UP_RATE_LIMIT_WINDOW_SEC
    : RATE_LIMIT_WINDOW_SEC;
  const acquired = await redisSetNxEx(key, "1", windowSec);
  if (acquired) return true;
  const held = await redisGetString(key);
  return held == null;
}
