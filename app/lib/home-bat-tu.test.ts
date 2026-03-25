import { describe, expect, it } from "vitest";

import {
  buildCalendarDaysForMonth,
  parseNgayHomNayForHome,
  parseWeeklyGoodDayCount,
} from "~/lib/home-bat-tu";

describe("parseNgayHomNayForHome", () => {
  it("reads hoang_dao and hours from a typical-shaped payload", () => {
    const v = parseNgayHomNayForHome({
      solar_date: "2026-03-25",
      lunar_label: "6 tháng 2",
      hoang_dao: true,
      good_hours: "7h–9h",
    });
    expect(v).not.toBeNull();
    expect(v!.dayType).toBe("hoang-dao");
    expect(v!.hourRange).toBe("7h–9h");
    expect(v!.lunarLabel).toBe("6 tháng 2");
    expect(v!.solarDateVi).toMatch(/2026/);
  });
});

describe("parseWeeklyGoodDayCount", () => {
  it("counts hoang-dao rows in days array", () => {
    const n = parseWeeklyGoodDayCount({
      days: [
        { date: "2026-03-24", hoang_dao: true },
        { date: "2026-03-25", hac_dao: true },
        { solar_date: "2026-03-26", day_type: "hoang-dao" },
      ],
    });
    expect(n).toBe(2);
  });
});

describe("buildCalendarDaysForMonth", () => {
  it("merges lich-thang day rows with neutral fill", () => {
    const days = buildCalendarDaysForMonth(3, 2026, {
      days: [
        { solar_date: "2026-03-01", lunar_day: 2, hoang_dao: true },
        { solar_date: "2026-03-02", lunar_day: 3, hac_dao: true },
      ],
    });
    expect(days).toHaveLength(31);
    expect(days[0]?.dayType).toBe("hoang-dao");
    expect(days[1]?.dayType).toBe("hac-dao");
    expect(days[2]?.dayType).toBe("neutral");
  });
});
