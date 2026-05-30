import { describe, expect, it } from "vitest";

import {
  parseLichThangScoreMethodology,
  parseNgayHomNayForHome,
} from "./home-bat-tu";

describe("parseNgayHomNayForHome score_methodology", () => {
  it("parses score_methodology from ngay-hom-nay", () => {
    const home = parseNgayHomNayForHome({
      date: "2026-05-29",
      score: 72,
      score_methodology: {
        summary_vi: "Điểm cá nhân hóa theo lá số.",
        weights: [{ factor: "truc", label_vi: "Trực", max_points: 24 }],
      },
      can_chi: { name: "Giáp Tý" },
      lunar: { display: "Mùng 3" },
      truc: { name: "Khai" },
      daily_advice: { summary_vi: "Thuận khai trương." },
    });
    expect(home?.scoreMethodology?.summaryVi).toContain("cá nhân");
    expect(home?.scoreMethodology?.weights[0]?.labelVi).toBe("Trực");
  });
});

describe("parseLichThangScoreMethodology", () => {
  it("reads methodology from lich-thang payload", () => {
    const m = parseLichThangScoreMethodology({
      month: "2026-05",
      score_methodology: {
        summary_vi: "Tháng chấm theo bản mệnh.",
        weights: [],
      },
    });
    expect(m?.summaryVi).toContain("Tháng");
  });
});
