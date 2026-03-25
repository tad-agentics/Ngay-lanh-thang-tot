import { describe, expect, it } from "vitest";

import { parseDayDetailForView } from "~/lib/day-detail-view";

describe("parseDayDetailForView", () => {
  it("maps tu-tru-api day-detail shape", () => {
    const v = parseDayDetailForView({
      status: "success",
      date: "2026-03-20",
      lunar_date: "Ngày 2 tháng Hai năm Bính Ngọ",
      can_chi: "Quý Sửu",
      hoang_dao: false,
      star_name: "Câu Trận",
      truc_name: "Khai",
      truc_score: 2,
      sao_28: "Lâu",
      score: 72,
      grade: "B",
      reason_vi: "Hắc Đạo — Trực Khai",
      good_for: ["Khai trương"],
      avoid_for: [],
      gio_tot: [{ chi_name: "Dần", range: "03:00-05:00" }],
      gio_xau: [{ chi_name: "Tý", range: "23:00-01:00" }],
      breakdown: [
        {
          source: "Điểm cơ bản",
          points: 50,
          reason_vi: "Mọi ngày bắt đầu từ 50 điểm",
          type: "neutral",
        },
      ],
    });
    expect(v).not.toBeNull();
    expect(v!.lunarDate).toContain("Bính Ngọ");
    expect(v!.canChi).toBe("Quý Sửu");
    expect(v!.trucLine).toContain("Khai");
    expect(v!.starLine).toContain("Câu Trận");
    expect(v!.score).toBe(72);
    expect(v!.grade).toBe("B");
    expect(v!.reasonLines.some((x) => x.includes("Hắc"))).toBe(true);
    expect(v!.goodFor).toContain("Khai trương");
    expect(v!.gioTot).toContain("giờ");
    expect(v!.gioTot).not.toContain("Dần");
    expect(v!.gioXau).toContain("giờ");
    expect(v!.gioXau).not.toContain("Tý");
    expect(v!.breakdown).toHaveLength(1);
    expect(v!.breakdown[0]?.points).toBe(50);
  });
});
