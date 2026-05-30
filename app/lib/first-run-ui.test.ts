import { describe, expect, it } from "vitest";

import {
  formatCanhRangeDetail,
  formatCanhSelectionDetail,
} from "~/lib/first-run-ui";

describe("formatCanhRangeDetail", () => {
  it("appends sáng for Mão", () => {
    expect(formatCanhRangeDetail("5–7h", "Mão")).toBe("5–7h sáng");
  });

  it("appends trưa for Ngọ", () => {
    expect(formatCanhRangeDetail("11–13h", "Ngọ")).toBe("11–13h trưa");
  });

  it("leaves Tý unchanged", () => {
    expect(formatCanhRangeDetail("23–1h", "Tý")).toBe("23–1h");
  });
});

describe("formatCanhSelectionDetail", () => {
  it("shows pillar label and element", () => {
    expect(
      formatCanhSelectionDetail(
        "5–7h",
        "Mão",
        { label: "Ất Mão", hanh: "Mộc" },
        false,
      ),
    ).toBe("5–7h sáng · trụ giờ Ất Mão · hành Mộc");
  });

  it("shows loading copy", () => {
    expect(formatCanhSelectionDetail("5–7h", "Mão", null, true)).toBe(
      "5–7h sáng · đang tính trụ giờ…",
    );
  });
});
