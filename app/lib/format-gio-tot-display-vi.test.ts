import { describe, expect, it } from "vitest";

import {
  formatGioTotArrayDisplayVi,
  formatHourRangeForDayDetailFigmaVi,
  formatHourRangeForDisplayVi,
  formatHourRangeStringDisplayVi,
} from "~/lib/format-gio-tot-display-vi";

describe("formatGioTotArrayDisplayVi", () => {
  it("formats morning and afternoon like user example", () => {
    const s = formatGioTotArrayDisplayVi([
      { chi_name: "Thìn", range: "07:00-09:00" },
      { chi_name: "Mùi", range: "13:00-15:00" },
    ]);
    expect(s).toContain("7 - 9 giờ sáng");
    expect(s).toContain("13 - 15 giờ chiều");
    expect(s).toContain(" · ");
    expect(s).not.toContain("Thìn");
  });

  it("handles overnight slot", () => {
    const s = formatGioTotArrayDisplayVi([
      { chi_name: "Tý", range: "23:00-01:00" },
    ]);
    expect(s).toContain("đêm");
    expect(s).toMatch(/23/);
  });
});

describe("formatHourRangeStringDisplayVi", () => {
  it("parses chi-prefixed segments", () => {
    const s = formatHourRangeStringDisplayVi(
      "Tý 23:00-01:00; Dần 03:00-05:00",
    );
    expect(s).toBeTruthy();
    expect(s!.split(" · ")).toHaveLength(2);
  });
});

describe("formatHourRangeForDisplayVi", () => {
  it("prefers array over fallback string", () => {
    const s = formatHourRangeForDisplayVi("ignored", [
      { range: "09:00-11:00" },
    ]);
    expect(s).toContain("9 - 11 giờ sáng");
  });
});

describe("formatHourRangeForDayDetailFigmaVi", () => {
  it("joins compact hour ranges with commas", () => {
    const s = formatHourRangeForDayDetailFigmaVi("", [
      { range: "07:00-09:00" },
      { range: "13:00-15:00" },
      { range: "19:00-21:00" },
    ]);
    expect(s).toBe("7–9h, 13–15h, 19–21h");
  });

  it("formats overnight as start–endh", () => {
    const s = formatHourRangeForDayDetailFigmaVi("", [
      { range: "23:00-01:00" },
    ]);
    expect(s).toBe("23–1h");
  });
});
