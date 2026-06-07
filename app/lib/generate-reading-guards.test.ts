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
  generateReadingRateLimitScope,
  subscriptionActiveForReading,
} from "../../supabase/functions/_shared/generate-reading-guards.ts";

describe("generateReadingRateLimitScope", () => {
  it("isolates paywall preview from full la-so-chi-tiet", () => {
    expect(
      generateReadingRateLimitScope("la-so-chi-tiet", { preview: true }),
    ).toBe("la-so-chi-tiet:preview");
    expect(generateReadingRateLimitScope("la-so-chi-tiet")).toBe(
      "la-so-chi-tiet",
    );
  });

  it("isolates day-detail inline from anchor full", () => {
    expect(
      generateReadingRateLimitScope("day-detail", { variant: "inline" }),
    ).toBe("day-detail:inline");
    expect(generateReadingRateLimitScope("day-detail")).toBe("day-detail:full");
    expect(
      generateReadingRateLimitScope("day-detail", { followUp: true }),
    ).toBe("day-detail:follow-up");
  });
});

describe("acquireGenerateReadingRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows when NX acquires the slot (no GET follow-up)", async () => {
    redisSetNxEx.mockResolvedValue(true);

    await expect(acquireGenerateReadingRateLimit("user-1")).resolves.toBe(true);
    expect(redisSetNxEx).toHaveBeenCalledWith(
      "gen_reading_rl:v1:user-1:default",
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
      "gen_reading_rl_followup:v1:user-1:default",
      "1",
      2,
    );
  });

  it("blocks when NX misses and the rate-limit key is held", async () => {
    redisSetNxEx.mockResolvedValue(false);
    redisGetString.mockResolvedValue("1");

    await expect(acquireGenerateReadingRateLimit("user-1")).resolves.toBe(false);
    expect(redisGetString).toHaveBeenCalledWith(
      "gen_reading_rl:v1:user-1:default",
    );
  });

  it("allows parallel scopes for Bát Tự bundle invokes", async () => {
    redisSetNxEx.mockResolvedValue(true);

    await expect(
      acquireGenerateReadingRateLimit("user-1", {
        scope: "la-so-chi-tiet",
      }),
    ).resolves.toBe(true);
    await expect(
      acquireGenerateReadingRateLimit("user-1", {
        scope: "luu-nien:only-luu-life",
      }),
    ).resolves.toBe(true);
    expect(redisSetNxEx).toHaveBeenCalledWith(
      "gen_reading_rl:v1:user-1:luu-nien:only-luu-life",
      "1",
      10,
    );
  });

  it("fails open when NX misses and GET finds no key (Redis outage)", async () => {
    redisSetNxEx.mockResolvedValue(false);
    redisGetString.mockResolvedValue(null);

    // A transient Redis fault must never hard-block every paid reading:
    // block only when the slot is confirmed held.
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
