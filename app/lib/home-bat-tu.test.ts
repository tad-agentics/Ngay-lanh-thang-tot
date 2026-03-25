import { describe, expect, it } from "vitest";

import {
  buildCalendarDaysForMonth,
  parseNgayHomNayForHome,
  parseWeeklyGoodDayCount,
  parseWeeklySummaryForScreen,
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

  it("maps tu-tru-api ngay-hom-nay (lunar.display, gio_tot[], hoang_dao object)", () => {
    const v = parseNgayHomNayForHome({
      status: "success",
      date: "2026-03-25",
      lunar: { display: "Ngày 7 tháng Hai năm Bính Ngọ", day: 7, month: 2 },
      hoang_dao: { is_hoang_dao: true, star_name: "Kim Quỹ" },
      gio_tot: [
        { chi_name: "Tý", range: "23:00-01:00" },
        { chi_name: "Sửu", range: "01:00-03:00" },
      ],
    });
    expect(v).not.toBeNull();
    expect(v!.dayType).toBe("hoang-dao");
    expect(v!.lunarLabel).toContain("Bính Ngọ");
    expect(v!.hourRange).toContain("Tý");
    expect(v!.hourRange).toContain("23:00");
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

  it("counts grade A/B (or score≥70) in top_dates when no scalar count", () => {
    const n = parseWeeklyGoodDayCount({
      status: "success",
      top_dates: [
        { date: "2026-03-30", score: 100, grade: "A" },
        { date: "2026-03-26", score: 66, grade: "B" },
        { date: "2026-03-27", score: 40, grade: "C" },
      ],
    });
    expect(n).toBe(2);
  });
});

describe("parseWeeklySummaryForScreen", () => {
  it("maps tu-tru-api weekly-summary (top_dates, week range, best_hours)", () => {
    const s = parseWeeklySummaryForScreen({
      status: "success",
      week_start: "2026-03-25",
      week_end: "2026-03-31",
      intent: "MAC_DINH",
      count: 3,
      top_dates: [
        {
          date: "2026-03-30",
          score: 100,
          grade: "A",
          one_liner: "Rất tốt.",
          best_hours: [{ chi_name: "Dần", range: "03:00-05:00" }],
        },
      ],
    });
    expect(s).not.toBeNull();
    expect(s!.weekRangeLabel).toContain("25");
    expect(s!.weekRangeLabel).toContain("31");
    expect(s!.summaryCount).toBe(3);
    expect(s!.rows).toHaveLength(1);
    expect(s!.rows[0]?.isoDate).toBe("2026-03-30");
    expect(s!.rows[0]?.bestHours).toContain("Dần");
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

  it("infers hoàng/hắc đạo from tu-tru-api badge on month days", () => {
    const days = buildCalendarDaysForMonth(3, 2026, {
      days: [
        { date: "2026-03-01", lunar_day: 13, badge: "hac_dao" },
        { date: "2026-03-02", lunar_day: 14, badge: "hoang_dao" },
      ],
    });
    expect(days[0]?.dayType).toBe("hac-dao");
    expect(days[1]?.dayType).toBe("hoang-dao");
  });
});
