import { redisGetString, redisSetNxEx } from "./redis-cache.ts";

const CHECKOUT_QUOTE_RATE_WINDOW_SEC = 3;

/**
 * At most one checkout quote per user per 3s (when Redis configured).
 * Returns true when the caller may proceed.
 */
export async function acquireCheckoutQuoteRateLimit(
  userId: string,
): Promise<boolean> {
  const key = `checkout_quote_rl:v1:${userId}`;
  const acquired = await redisSetNxEx(key, "1", CHECKOUT_QUOTE_RATE_WINDOW_SEC);
  if (acquired) return true;
  const held = await redisGetString(key);
  return held == null;
}
