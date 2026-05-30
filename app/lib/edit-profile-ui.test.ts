import { describe, expect, it } from "vitest";

import {
  formatConvertDateLunarHint,
  formatEditProfileBirthTime,
} from "~/lib/edit-profile-ui";

describe("formatConvertDateLunarHint", () => {
  it("formats lunar day, month, and can chi like Make", () => {
    expect(
      formatConvertDateLunarHint({
        result: {
          lunar_day: 26,
          lunar_month: 4,
          can_chi_year: "Canh Ngọ",
        },
      }),
    ).toBe("26 · Tháng Tư · Canh Ngọ");
  });

  it("uses Mùng prefix for days 1–10", () => {
    expect(
      formatConvertDateLunarHint({
        result: { lunar_day: 3, lunar_month: 2, can_chi_year: "Giáp Thìn" },
      }),
    ).toBe("Mùng 3 · Tháng Hai · Giáp Thìn");
  });

  it("falls back to display_vi", () => {
    expect(
      formatConvertDateLunarHint({
        result: { display_vi: "Ngày 25 tháng Tư" },
      }),
    ).toBe("Ngày 25 tháng Tư");
  });
});

describe("formatEditProfileBirthTime", () => {
  it("formats canh like Make", () => {
    expect(formatEditProfileBirthTime("6")).toBe("Mão · 5–7h sáng");
  });

  it("handles unset", () => {
    expect(formatEditProfileBirthTime("__unset__")).toBe("Không rõ giờ sinh");
  });
});
