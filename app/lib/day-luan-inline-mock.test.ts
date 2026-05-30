import { describe, expect, it } from "vitest";

import { dayLuanOtherDayInlineMock } from "./day-luan-inline-mock";

describe("dayLuanOtherDayInlineMock", () => {
  it("includes can chi and score when provided", () => {
    const t = dayLuanOtherDayInlineMock({
      canChi: "Nhâm Dần",
      score: 72,
    });
    expect(t).toContain("Nhâm Dần");
    expect(t).toContain("72");
    expect(t).toContain("Đặt lịch");
  });
});
