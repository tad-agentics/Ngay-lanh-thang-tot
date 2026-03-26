import { describe, expect, it } from "vitest";

import {
  buildVanThangMonthHeading,
  parseConvertDateLunarTucLine,
  solarYmToTitleLabel,
  stripRedundantSolarMonthPrefix,
} from "./van-thang-month-label";

describe("solarYmToTitleLabel", () => {
  it("formats Tháng M Năm YYYY", () => {
    expect(solarYmToTitleLabel("2026-03")).toBe("Tháng 3 Năm 2026");
  });
});

describe("stripRedundantSolarMonthPrefix", () => {
  it("bỏ mở đầu trùng tháng dương (chữ thường)", () => {
    expect(
      stripRedundantSolarMonthPrefix(
        "tháng 3 năm 2026. Tương tác với Nhật Chủ Ất: Giữ nhịp.",
        "2026-03",
      ),
    ).toBe("Tương tác với Nhật Chủ Ất: Giữ nhịp.");
  });

  it("bỏ cả khi có ngoặc tức âm lịch", () => {
    expect(
      stripRedundantSolarMonthPrefix(
        "Tháng 3 Năm 2026 (tức Tháng 2 Năm Bính Ngọ). Phần còn lại.",
        "2026-03",
      ),
    ).toBe("Phần còn lại.");
  });

  it("giữ nguyên nếu không khớp", () => {
    const s = "Tương tác với Nhật Chủ — giữ nguyên.";
    expect(stripRedundantSolarMonthPrefix(s, "2026-03")).toBe(s);
  });
});

describe("buildVanThangMonthHeading", () => {
  it("adds tức khi có âm lịch", () => {
    expect(
      buildVanThangMonthHeading("Tháng 3 Năm 2026", "Tháng 2 Năm Bính Ngọ"),
    ).toBe("Tháng 3 Năm 2026 (tức Tháng 2 Năm Bính Ngọ)");
  });

  it("chỉ dương khi chưa có âm", () => {
    expect(buildVanThangMonthHeading("Tháng 3 Năm 2026", null)).toBe(
      "Tháng 3 Năm 2026",
    );
  });
});

describe("parseConvertDateLunarTucLine", () => {
  it("reads lunar object month + year_can_chi", () => {
    const s = parseConvertDateLunarTucLine({
      lunar: { month: 2, year_can_chi: "Bính Ngọ" },
    });
    expect(s).toBe("Tháng 2 Năm Bính Ngọ");
  });

  it("gộp month trong lunar với year_can_chi ở root (API tách cấp)", () => {
    expect(
      parseConvertDateLunarTucLine({
        lunar: { month: 2, day: 12 },
        year_can_chi: "Bính Ngọ",
      }),
    ).toBe("Tháng 2 Năm Bính Ngọ");
  });

  it("reads lunar_date prose (tháng Hai)", () => {
    const s = parseConvertDateLunarTucLine({
      lunar_date: "Ngày 2 tháng Hai năm Bính Ngọ",
    });
    expect(s).toContain("Bính Ngọ");
    expect(s).toContain("2");
  });

  it("reads prose với tháng số", () => {
    expect(
      parseConvertDateLunarTucLine({
        lunar_label: "Mùng 1 tháng 2 năm Bính Ngọ",
      }),
    ).toBe("Tháng 2 Năm Bính Ngọ");
  });
});
