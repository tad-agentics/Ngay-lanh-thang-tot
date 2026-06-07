import { describe, expect, it } from "vitest";

import { traCuuDayLuuY, traCuuDayWhyFromReading } from "~/lib/tra-cuu-day-copy";

describe("traCuuDayWhyFromReading", () => {
  it("returns first sentence of anchor reading", () => {
    expect(
      traCuuDayWhyFromReading("Câu một. Câu hai.", "fallback"),
    ).toBe("Câu một.");
  });

  it("uses fallback when reading is empty", () => {
    expect(traCuuDayWhyFromReading(null, "fallback")).toBe("fallback");
  });
});

describe("traCuuDayLuuY", () => {
  it("extracts second sentence from anchor prose", () => {
    expect(
      traCuuDayLuuY(
        "Kim sinh Thủy hợp mệnh. Mặc trắng hoặc xám, quay hướng Đông Nam.",
        null,
      ),
    ).toBe("Mặc trắng hoặc xám, quay hướng Đông Nam.");
  });

  it("falls back to breakdown when reading has no remainder", () => {
    expect(traCuuDayLuuY("Một câu duy nhất.", "Ưu tiên buổi sáng.")).toBe(
      "Ưu tiên buổi sáng.",
    );
  });
});
