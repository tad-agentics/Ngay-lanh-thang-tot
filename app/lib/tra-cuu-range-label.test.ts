import { describe, expect, it } from "vitest";

import {
  TRA_CUU_DEFAULT_RANGE_LABEL,
  isTraCuuRefineChipActive,
  traCuuRangeLabelForDays,
  traCuuWeekendRangeLabel,
} from "~/lib/tra-cuu-range-label";

describe("traCuuRangeLabelForDays", () => {
  it("uses default label for 30 days", () => {
    expect(traCuuRangeLabelForDays(30)).toBe(TRA_CUU_DEFAULT_RANGE_LABEL);
  });

  it("uses extended label for 90 days", () => {
    expect(traCuuRangeLabelForDays(90)).toContain("3 tháng");
  });
});

describe("isTraCuuRefineChipActive", () => {
  it("highlights weekend chip when filter is weekend", () => {
    expect(
      isTraCuuRefineChipActive("weekend", "weekend", TRA_CUU_DEFAULT_RANGE_LABEL),
    ).toBe(true);
    expect(
      isTraCuuRefineChipActive("weekend", "all", TRA_CUU_DEFAULT_RANGE_LABEL),
    ).toBe(false);
  });

  it("highlights extended90 when range is 3 months and filter all", () => {
    expect(
      isTraCuuRefineChipActive("extended90", "all", "mở rộng · 3 tháng tới"),
    ).toBe(true);
    expect(
      isTraCuuRefineChipActive("extended90", "all", TRA_CUU_DEFAULT_RANGE_LABEL),
    ).toBe(false);
  });

  it("highlights all chip only on default month range", () => {
    expect(
      isTraCuuRefineChipActive("all", "all", TRA_CUU_DEFAULT_RANGE_LABEL),
    ).toBe(true);
    expect(
      isTraCuuRefineChipActive(
        "all",
        "all",
        traCuuWeekendRangeLabel(30),
      ),
    ).toBe(false);
  });
});
