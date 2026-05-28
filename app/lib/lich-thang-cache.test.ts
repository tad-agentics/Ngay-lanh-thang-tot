import { afterEach, describe, expect, it } from "vitest";

import type { CalendarDay } from "~/lib/api-types";
import {
  lichThangBirthFingerprint,
  readLichThangCache,
  refreshCalendarTodayFlags,
  writeLichThangCache,
} from "~/lib/lich-thang-cache";

const sampleDay: CalendarDay = {
  isoDate: "2026-05-27",
  dayType: "hoang-dao",
  isToday: false,
  lunarDay: 10,
  lunarMonth: 4,
  score: 82,
};

describe("lich-thang-cache", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("round-trips month grid", () => {
    writeLichThangCache("u1", "2026-05", "1990-01-01|11|1", {
      days: [sampleDay],
      lunarMonthLabel: "T4 · Ất Tỵ",
    });
    const hit = readLichThangCache("u1", "2026-05", "1990-01-01|11|1");
    expect(hit?.days).toHaveLength(1);
    expect(hit?.lunarMonthLabel).toBe("T4 · Ất Tỵ");
  });

  it("misses when birth fingerprint changes", () => {
    writeLichThangCache("u1", "2026-05", "a", {
      days: [sampleDay],
      lunarMonthLabel: null,
    });
    expect(readLichThangCache("u1", "2026-05", "b")).toBeNull();
  });

  it("refreshes isToday on read", () => {
    writeLichThangCache("u1", "2026-05", "fp", {
      days: [{ ...sampleDay, isToday: false }],
      lunarMonthLabel: null,
    });
    const hit = readLichThangCache("u1", "2026-05", "fp");
    const refreshed = refreshCalendarTodayFlags(hit!.days, "2026-05-27");
    expect(refreshed[0]?.isToday).toBe(true);
  });

  it("builds birth fingerprint from query body", () => {
    expect(
      lichThangBirthFingerprint({
        birth_date: "1990-05-01",
        birth_time: 11,
        gender: 1,
      }),
    ).toBe("1990-05-01|11|1");
  });
});
