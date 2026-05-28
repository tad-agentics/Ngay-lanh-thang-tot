import { describe, expect, it } from "vitest";

import type { DayDetailViewModel } from "~/lib/day-detail-view";
import {
  anchorQuestionForScore,
  buildDayLuanSectionRows,
  formatDaySectionSubline,
} from "~/lib/day-luan-sectioned";

const baseDetail: DayDetailViewModel = {
  lunarDate: "—",
  canChi: "Nhâm Dần",
  trucLine: "Trực Thu",
  starLine: "Sao Thiên Lao · Tú",
  trucTitle: "Trực Thu",
  trucDisplay: "Thu",
  trucDescription: "Trực Thu — thu hoạch, kết thúc chu kỳ.",
  score: 35,
  grade: "D",
  reasonLines: ["Can Chi Nhâm Dần đối chiếu với mệnh Thổ của bạn."],
  goodFor: ["Việc nhỏ"],
  avoidFor: [],
  gioTot: "Thìn 7–9h",
  gioXau: "Tỵ 9–11h",
  catThanLabels: [],
  hungSatLabels: ["Thiên Cương"],
  purposeRows: [],
  breakdown: [
    {
      source: "ĐIỂM CƠ BẢN",
      points: 50,
      reasonVi: "Mọi ngày bắt đầu từ 50 điểm.",
      type: "neutral",
    },
    {
      source: "THIÊN CƯƠNG",
      points: -15,
      reasonVi: "Hung tinh Thiên Cương — kỵ Sự kiện chung",
      type: "penalty",
    },
  ],
};

describe("buildDayLuanSectionRows", () => {
  it("returns four canonical Vietnamese factor rows", () => {
    const rows = buildDayLuanSectionRows(baseDetail);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.title)).toEqual([
      "Trực ngày",
      "Nhị thập bát tú",
      "Can chi · tương sinh với lá số bạn",
      "Giờ vàng trong ngày",
    ]);
  });

  it("maps hung-star penalty to sao factor, not base score row", () => {
    const rows = buildDayLuanSectionRows(baseDetail);
    expect(rows[0]?.score).toBe("");
    expect(rows[1]?.score).toBe("-15");
    expect(rows[1]?.verdict).toContain("Thiên Lao");
  });

  it("includes source refs for inline citations", () => {
    const rows = buildDayLuanSectionRows(baseDetail);
    expect(rows.map((r) => r.sourceRef)).toEqual(["[1]", "[2]", "[3]", "[4]"]);
  });
});

describe("anchorQuestionForScore", () => {
  it("uses the viewed date, not hôm nay", () => {
    expect(anchorQuestionForScore(35, "2026-05-28")).toBe(
      "Tại sao ngày 28.05 được 35 điểm với mệnh của tôi?",
    );
  });
});

describe("formatDaySectionSubline", () => {
  it("combines long date and can chi", () => {
    expect(formatDaySectionSubline("2026-05-28", "Nhâm Dần")).toBe(
      "28.05.2026 · ngày Nhâm Dần",
    );
  });
});
