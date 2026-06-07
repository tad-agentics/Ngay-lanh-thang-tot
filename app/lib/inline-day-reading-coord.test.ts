import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearInlineReadingFailCooldown,
  INLINE_READING_FAIL_COOLDOWN_MS,
  inlineReadingRunKey,
  isInlineReadingFailCooldown,
  markInlineReadingFailCooldown,
  resetInlineReadingInflightForTests,
  runInlineReadingDeduped,
} from "./inline-day-reading-coord";

const USER = "user-1";
const ISO = "2026-06-07";

describe("inline-day-reading-coord", () => {
  afterEach(() => {
    sessionStorage.clear();
    resetInlineReadingInflightForTests();
    vi.restoreAllMocks();
  });

  it("marks and respects fail cooldown", () => {
    const now = 1_000_000;
    expect(isInlineReadingFailCooldown(USER, ISO, now)).toBe(false);
    markInlineReadingFailCooldown(USER, ISO, now);
    expect(isInlineReadingFailCooldown(USER, ISO, now + 1)).toBe(true);
    expect(
      isInlineReadingFailCooldown(
        USER,
        ISO,
        now + INLINE_READING_FAIL_COOLDOWN_MS,
      ),
    ).toBe(false);
    clearInlineReadingFailCooldown(USER, ISO);
    expect(isInlineReadingFailCooldown(USER, ISO, now + 1)).toBe(false);
  });

  it("dedupes concurrent runs for the same key", async () => {
    const run = vi.fn(async () => ({ text: "ok", failed: false }));
    const key = inlineReadingRunKey(USER, ISO, "ngay-hom-nay", "hash-a");
    const [a, b] = await Promise.all([
      runInlineReadingDeduped(key, run),
      runInlineReadingDeduped(key, run),
    ]);
    expect(run).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ text: "ok", failed: false });
    expect(b).toEqual({ text: "ok", failed: false });
  });

  it("runs again after the first inflight promise settles", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ text: null, failed: true })
      .mockResolvedValueOnce({ text: "retry", failed: false });
    const key = inlineReadingRunKey(USER, ISO, "day-detail", "hash-b");
    await runInlineReadingDeduped(key, run);
    await runInlineReadingDeduped(key, run);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
