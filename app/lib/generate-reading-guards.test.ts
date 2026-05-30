import { beforeEach, describe, expect, it, vi } from "vitest";

const { redisGetString, redisSetNxEx } = vi.hoisted(() => ({
  redisGetString: vi.fn(),
  redisSetNxEx: vi.fn(),
}));

vi.mock("../../supabase/functions/_shared/redis-cache.ts", () => ({
  redisGetString,
  redisSetNxEx,
  redisRestConfigured: vi.fn(() => true),
}));

import {
  acquireGenerateReadingRateLimit,
  subscriptionActiveForReading,
} from "../../supabase/functions/_shared/generate-reading-guards.ts";

describe("acquireGenerateReadingRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows when NX acquires the slot (no GET follow-up)", async () => {
    redisSetNxEx.mockResolvedValue(true);

    await expect(acquireGenerateReadingRateLimit("user-1")).resolves.toBe(true);
    expect(redisSetNxEx).toHaveBeenCalledWith(
      "gen_reading_rl:v1:user-1",
      "1",
      10,
    );
    expect(redisGetString).not.toHaveBeenCalled();
  });

  it("follow-up uses a separate Redis key from primary generation", async () => {
    redisSetNxEx.mockResolvedValue(true);

    await expect(
      acquireGenerateReadingRateLimit("user-1", { followUp: true }),
    ).resolves.toBe(true);
    expect(redisSetNxEx).toHaveBeenCalledWith(
      "gen_reading_rl_followup:v1:user-1",
      "1",
      2,
    );
  });

  it("blocks when NX misses and the rate-limit key is held", async () => {
    redisSetNxEx.mockResolvedValue(false);
    redisGetString.mockResolvedValue("1");

    await expect(acquireGenerateReadingRateLimit("user-1")).resolves.toBe(false);
    expect(redisGetString).toHaveBeenCalledWith("gen_reading_rl:v1:user-1");
  });

  it("fails open when NX returns false but GET finds no key (Redis error)", async () => {
    redisSetNxEx.mockResolvedValue(false);
    redisGetString.mockResolvedValue(null);

    await expect(acquireGenerateReadingRateLimit("user-1")).resolves.toBe(true);
  });
});

describe("subscriptionActiveForReading", () => {
  it("returns false for null or past expiry", () => {
    expect(subscriptionActiveForReading(null)).toBe(false);
    expect(subscriptionActiveForReading("2020-01-01T00:00:00.000Z")).toBe(false);
  });

  it("returns true when expiry is in the future", () => {
    const future = new Date(Date.now() + 864e5).toISOString();
    expect(subscriptionActiveForReading(future)).toBe(true);
  });
});
