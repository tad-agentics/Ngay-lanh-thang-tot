import { describe, expect, it } from "vitest";

import { normalizeLichDayIso } from "~/hooks/useLichDayData";

describe("normalizeLichDayIso", () => {
  const fallback = "2026-06-07";

  it("returns valid iso as-is", () => {
    expect(normalizeLichDayIso("2026-06-15", fallback)).toBe("2026-06-15");
  });

  it("trims and slices to date part", () => {
    expect(normalizeLichDayIso("  2026-06-15T12:00:00  ", fallback)).toBe(
      "2026-06-15",
    );
  });

  it("falls back for null, empty, or invalid", () => {
    expect(normalizeLichDayIso(null, fallback)).toBe(fallback);
    expect(normalizeLichDayIso("", fallback)).toBe(fallback);
    expect(normalizeLichDayIso("not-a-date", fallback)).toBe(fallback);
    expect(normalizeLichDayIso("2026-6-7", fallback)).toBe(fallback);
  });
});
