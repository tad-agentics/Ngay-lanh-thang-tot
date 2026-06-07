import { describe, expect, it } from "vitest";

import type { ResultDay } from "~/lib/api-types";
import { filterWeekendDays, isWeekendIso } from "~/lib/tra-cuu-weekend";

const day = (iso: string): ResultDay => ({
  isoDate: iso,
  dateLabel: iso,
  canChi: "—",
  lunarLabel: "—",
  truc: "—",
  bestHour: "—",
  grade: "B",
  reasons: [],
});

describe("tra-cuu-weekend", () => {
  it("detects Saturday and Sunday", () => {
    expect(isWeekendIso("2026-06-06")).toBe(true); // Sat
    expect(isWeekendIso("2026-06-07")).toBe(true); // Sun
    expect(isWeekendIso("2026-06-08")).toBe(false); // Mon
  });

  it("filters ranked days to weekend only", () => {
    const days = [
      day("2026-06-08"),
      day("2026-06-06"),
      day("2026-06-09"),
      day("2026-06-07"),
    ];
    expect(filterWeekendDays(days).map((d) => d.isoDate)).toEqual([
      "2026-06-06",
      "2026-06-07",
    ]);
  });
});
