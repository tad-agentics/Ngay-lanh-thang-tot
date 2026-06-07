import { describe, expect, it } from "vitest";

import { parseDayDetailForView } from "~/lib/day-detail-view";
import {
  buildCalendarDaysForMonth,
  buildCalendarLockedDayTeaser,
  buildHomeInlineFallback,
  formatLichThangMonthKey,
  mergeDayDetailScoreIntoHome,
  parseLichThangLunarMonthLabel,
  parseNgayHomNayForHome,
  parseWeeklyGoodDayCount,
  parseWeeklySummaryForScreen,
  isEngineScoreBreakdownLine,
  pickInlineLuanFallback,
} from "~/lib/home-bat-tu";
import { ngayHomNayToLichCard } from "~/lib/lich-format";
import { SCORE_METHODOLOGY_DEFAULT_SUMMARY } from "~/lib/score-methodology";

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
    expect(v!.hourRange).toBe("7 - 9 giờ sáng");
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
    expect(v!.yearCanChi).toBe("Bính Ngọ");
    expect(v!.hourRange).toContain("giờ");
    expect(v!.hourRange).toMatch(/23|đêm/);
    expect(v!.hourRange).not.toContain("Tý");
    expect(v!.gioTotChis).toEqual(["Tý", "Sửu"]);
    expect(v!.gioTotDisplay).toContain("Tý");
    expect(v!.gioTotDisplay).toContain("h");
    expect(v!.headerSubline).toContain("2026");
  });

  it("reads can_chi object and year from lunar.display (tu-tru-api shape)", () => {
    const v = parseNgayHomNayForHome({
      date: "2026-05-12",
      can_chi: {
        name: "Nhâm Tuất",
        can_name: "Nhâm",
        chi_name: "Tuất",
      },
      lunar: { display: "Ngày 12 tháng Tư năm Bính Ngọ", day: 12, month: 4 },
      truc: { name: "Thu" },
    });
    expect(v).not.toBeNull();
    expect(v!.canChi).toBe("Nhâm Tuất");
    expect(v!.yearCanChi).toBe("Bính Ngọ");
    expect(v!.trucDisplay).toBe("Thu");
  });

  it("parses maket-style trực, sao, việc nên làm, giờ xấu", () => {
    const v = parseNgayHomNayForHome({
      solar_date: "2026-05-11",
      can_chi: "Bính Tuất",
      lunar_label: "Mùng 10 tháng Tư năm Bính Ngọ",
      truc_name: "Trực Định",
      cat_than: [{ name: "Thiên Đức" }, "Nguyệt Đức"],
      good_for: ["Khai trương", "Ký kết", "Đính hôn"],
      gio_tot: [
        { chi_name: "Tý", range: "23:00-01:00" },
        { chi_name: "Sửu", range: "01:00-03:00" },
      ],
      gio_xau: [
        { chi_name: "Dần", range: "03:00-05:00" },
        { chi_name: "Ngọ", range: "11:00-13:00" },
      ],
    });
    expect(v).not.toBeNull();
    expect(v!.trucDisplay).toBe("Định");
    expect(v!.yearCanChi).toBe("Bính Ngọ");
    expect(v!.saoTotCsv).toContain("Thiên Đức");
    expect(v!.goodForChips[0]).toBe("Khai trương");
    expect(v!.gioXauChis).toEqual(["Dần", "Ngọ"]);
    expect(v!.headerSubline).toContain("Bính Tuất");
  });

  it("reads engine score when present", () => {
    const v = parseNgayHomNayForHome({
      solar_date: "2026-05-11",
      score: 87,
    });
    expect(v?.score).toBe(87);
  });

  it("parses avoid_for and daily_advice strings (tu-tru-api ngay-hom-nay)", () => {
    const v = parseNgayHomNayForHome({
      date: "2026-05-12",
      gio_tot: [{ chi_name: "Tý", range: "23:00-01:00" }],
      good_for: ["Khai trương", "Ký kết hợp đồng"],
      avoid_for: ["Phẫu thuật"],
      daily_advice: {
        nen_lam: "Hoàng Đạo (Kim Quỹ) — thuận lợi. Phù hợp: Nhập trạch.",
        nen_tranh: "Không có gì đặc biệt.",
      },
    });
    expect(v).not.toBeNull();
    expect(v!.goodForChips).toEqual(["Khai trương", "Ký kết hợp đồng", "Nhập trạch"]);
    expect(v!.avoidForChips).toEqual(["Phẫu thuật"]);
  });

  it("falls back to summary.tot/xau and hoang_dao.star_name when no good_for", () => {
    const v = parseNgayHomNayForHome({
      date: "2026-05-01",
      hoang_dao: { is_hoang_dao: false, star_name: "Bạch Hổ" },
      summary: {
        tot: ["Sao Giác"],
        xau: ["Hắc Đạo (Bạch Hổ)", "Nguyệt Kỵ"],
      },
      gio_tot: [{ chi_name: "Tý", range: "23:00-01:00" }],
    });
    expect(v).not.toBeNull();
    expect(v!.saoTotCsv).toContain("Sao Giác");
    expect(v!.saoXauCsv).toContain("Nguyệt Kỵ");
    const card = ngayHomNayToLichCard(v!, null, "2026-05-01");
    expect(card.rows.find((r) => r.key === "Nên")?.value).toContain("Sao Giác");
    expect(card.rows.find((r) => r.key === "Tránh")?.value).toContain("hỏi tiếp");
    expect(card.rows.find((r) => r.key === "Tránh")?.value).not.toContain(
      "Nguyệt Kỵ",
    );
  });
});

describe("ngayHomNayToLichCard", () => {
  it("uses iso for day numeral and full weekday (not DD/MM regex on vi solar string)", () => {
    const parsed = parseNgayHomNayForHome({
      date: "2026-05-12",
      can_chi: { name: "Nhâm Tuất" },
      lunar: { display: "Ngày 12 tháng Tư năm Bính Ngọ" },
      truc: { name: "Thu" },
      score: 68,
    });
    expect(parsed).not.toBeNull();
    const card = ngayHomNayToLichCard(parsed!, "Lộ Bàng Thổ", "2026-05-12");
    expect(card.dayNumber).toBe("12");
    expect(card.weekday).toBe("Thứ Ba");
    expect(card.masthead).toBe("Tháng 5 · 2026  ·  Bính Ngọ");
  });

  it("does not show fallback 68 when ngay-hom-nay omits score", () => {
    const parsed = parseNgayHomNayForHome({
      date: "2026-05-28",
      day_type: "neutral",
    });
    expect(parsed).not.toBeNull();
    const card = ngayHomNayToLichCard(parsed!, null, "2026-05-28");
    expect(card.score).toBeNull();
    expect(card.verdictLabel).toBe("Ngày bình");
  });
});

describe("mergeDayDetailScoreIntoHome", () => {
  it("overrides home score with day-detail personalized score", () => {
    const home = parseNgayHomNayForHome({
      date: "2026-05-28",
      day_type: "neutral",
    });
    expect(home).not.toBeNull();
    const merged = mergeDayDetailScoreIntoHome(home!, { score: 35 });
    expect(merged.score).toBe(35);
    const card = ngayHomNayToLichCard(merged, "Lộ Bàng Thổ", "2026-05-28");
    expect(card.score).toBe(35);
    expect(card.verdictLabel).toBe("Ngày tránh");
  });

  it("fills homeSummaryLine from day-detail reason_vi when ngay-hom-nay omits it", () => {
    const home = parseNgayHomNayForHome({
      date: "2026-05-29",
      day_type: "hoang-dao",
      good_for: ["Khai trương"],
    });
    expect(home).not.toBeNull();
    expect(home!.homeSummaryLine).toBe("");
    const merged = mergeDayDetailScoreIntoHome(home!, {
      score: 85,
      reason_vi: "Can Quý hòa Dụng Thần Thổ — thuận ký kết và khai trương.",
    });
    expect(merged.score).toBe(85);
    expect(merged.homeSummaryLine).toContain("Dụng Thần");
  });
});

describe("buildCalendarLockedDayTeaser", () => {
  it("teases đặt lịch instead of engine score breakdown", () => {
    const detail = parseDayDetailForView({
      score: 46,
      good_for: ["Ký kết"],
      avoid_for: ["Khởi sự lớn"],
      reason_vi:
        "Ngày Hắc Đạo (Chu Tước), sao Đẩu (tốt) trừ 4 điểm. Ảnh hưởng này được tính cho mục đích sự kiện chung.",
    });
    expect(detail).not.toBeNull();
    const line = buildCalendarLockedDayTeaser(detail!);
    expect(line).not.toContain("trừ 4 điểm");
    expect(line).not.toContain("sự kiện chung");
    expect(line).toMatch(/hỏi tiếp|đặt lịch|NLTT/i);
  });
});

describe("isEngineScoreBreakdownLine", () => {
  it("flags trực + điểm breakdown copy", () => {
    expect(
      isEngineScoreBreakdownLine(
        "Trực Trừ cộng 29 điểm trong tổng điểm ngày. Với lá số của bạn, Trực này hỗ trợ việc sự kiện chung.",
      ),
    ).toBe(true);
  });

  it("flags hắc đạo + sao điểm helper copy", () => {
    expect(
      isEngineScoreBreakdownLine(
        "Ngày Hắc Đạo (Chu Tước), sao Đẩu (tốt) trừ 4 điểm. Ảnh hưởng này được tính cho mục đích sự kiện chung.",
      ),
    ).toBe(true);
  });

  it("allows personalized reason prose", () => {
    expect(
      isEngineScoreBreakdownLine(
        "Can Quý hòa Dụng Thần Thổ — thuận ký kết và khai trương.",
      ),
    ).toBe(false);
  });
});

describe("pickInlineLuanFallback", () => {
  it("does not use score_methodology boilerplate as inline luận", () => {
    const home = parseNgayHomNayForHome({
      date: "2026-05-29",
      day_type: "hoang-dao",
      good_for: ["Khai trương"],
      score_methodology: { summary_vi: SCORE_METHODOLOGY_DEFAULT_SUMMARY },
    });
    expect(home).not.toBeNull();
    expect(home!.homeSummaryLine).toBe("");
    const line = pickInlineLuanFallback(home!);
    expect(line).not.toContain("Điểm tổng hợp từ Trực");
    expect(line).toContain("Khai trương");
  });

  it("falls back to chips when homeSummaryLine is score breakdown", () => {
    const home = parseNgayHomNayForHome({
      date: "2026-05-29",
      day_type: "hoang-dao",
      good_for: ["Khai trương"],
      summary_vi:
        "Trực Trừ cộng 29 điểm trong tổng điểm ngày. Với lá số của bạn, Trực này hỗ trợ việc sự kiện chung.",
    });
    expect(home).not.toBeNull();
    const line = pickInlineLuanFallback(home!);
    expect(line).not.toMatch(/cộng\s+29\s+điểm/i);
    expect(line).toContain("Khai trương");
  });
});

describe("buildHomeInlineFallback", () => {
  it("builds teaser from good/avoid chips when prose missing", () => {
    const home = parseNgayHomNayForHome({
      date: "2026-05-29",
      day_type: "hoang-dao",
      good_for: ["Khai trương", "Ký hợp đồng"],
      avoid_for: ["Động thổ"],
    });
    expect(home).not.toBeNull();
    const line = buildHomeInlineFallback(home!);
    expect(line).toContain("Khai trương");
    expect(line).toContain("Động thổ");
  });
});

describe("formatLichThangMonthKey", () => {
  it("formats month as YYYY-MM", () => {
    expect(formatLichThangMonthKey(2026, 6)).toBe("2026-06");
    expect(formatLichThangMonthKey(2026, 12)).toBe("2026-12");
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

describe("parseLichThangLunarMonthLabel", () => {
  it("reads lunar_month from first day row", () => {
    const label = parseLichThangLunarMonthLabel({
      days: [{ date: "2026-05-01", lunar_month: 4, lunar_day: 14 }],
    });
    expect(label).toBe("Tháng Tư âm");
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
    expect(days[0]?.lunarDay).toBe(13);
    expect(days[1]?.lunarDay).toBe(14);
  });

  it("reads score from month day rows", () => {
    const days = buildCalendarDaysForMonth(6, 2026, {
      days: [{ date: "2026-06-17", score: 91, lunar_day: 3 }],
    });
    expect(days[16]?.isoDate).toBe("2026-06-17");
    expect(days[16]?.score).toBe(91);
    expect(days[16]?.lunarDay).toBe(3);
  });
});
