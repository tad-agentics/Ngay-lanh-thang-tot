import { describe, expect, it } from "vitest";

import { formatIsoDateLichHeader } from "~/lib/tu-tru-dates";

describe("formatIsoDateLichHeader", () => {
  it("formats Wednesday 25 March 2026 per Make weekday labels", () => {
    expect(formatIsoDateLichHeader("2026-03-25")).toBe(
      "Thứ Tư, 25 tháng 3, 2026",
    );
  });

  it("returns raw prefix when iso invalid", () => {
    expect(formatIsoDateLichHeader("not-a-date")).toBe("not-a-date");
  });
});
