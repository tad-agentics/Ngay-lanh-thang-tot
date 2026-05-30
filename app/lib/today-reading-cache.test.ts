import { afterEach, describe, expect, it } from "vitest";

import {
  hasSeenInlineReading,
  markInlineReadingSeen,
  readTodayAiReadingCache,
  writeTodayAiReadingSession,
} from "~/lib/today-reading-cache";

describe("today-reading-cache", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("persists inline luận in localStorage", () => {
    writeTodayAiReadingSession("u1", "2026-05-27", "Luận ngắn.");
    expect(readTodayAiReadingCache("u1", "2026-05-27")).toBe("Luận ngắn.");
  });

  it("tracks typewriter seen state", () => {
    expect(hasSeenInlineReading("u1", "2026-05-27")).toBe(false);
    markInlineReadingSeen("u1", "2026-05-27");
    expect(hasSeenInlineReading("u1", "2026-05-27")).toBe(true);
  });
});
