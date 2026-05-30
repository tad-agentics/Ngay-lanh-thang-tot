import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DAY_LUAN_FOLLOW_UP_TODAY_ONLY_MESSAGE,
  dayLuanFollowUpAllowed,
} from "~/lib/day-luan-follow-up";

describe("dayLuanFollowUpAllowed (FE re-export)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("matches server todayIso rule", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T05:00:00.000Z"));
    expect(dayLuanFollowUpAllowed("2026-05-29")).toBe(true);
    expect(dayLuanFollowUpAllowed("2026-05-30")).toBe(false);
  });

  it("exports shared error copy", () => {
    expect(DAY_LUAN_FOLLOW_UP_TODAY_ONLY_MESSAGE).toContain("hôm nay");
  });
});
