import { describe, expect, it } from "vitest";

import {
  applyLichCalendarParams,
  hasValidLichNgayParam,
  lichDayPath,
  lichMonthPath,
  parseLichViewMonth,
  resolveLichViewYm,
  ymFromIso,
} from "~/lib/lich-day-url";

describe("lichDayPath", () => {
  const today = "2026-06-07";

  it("returns /lich for today", () => {
    expect(lichDayPath("2026-06-07", today)).toBe("/lich");
  });

  it("returns ngay + year/month for other days", () => {
    expect(lichDayPath("2026-06-15", today)).toBe(
      "/lich?ngay=2026-06-15&year=2026&month=6",
    );
  });

  it("falls back to /lich for invalid iso", () => {
    expect(lichDayPath("bad", today)).toBe("/lich");
  });
});

describe("lichMonthPath", () => {
  it("builds year/month query", () => {
    expect(lichMonthPath(2025, 3)).toBe("/lich?year=2025&month=3");
  });
});

describe("ymFromIso", () => {
  it("extracts year and month", () => {
    expect(ymFromIso("2026-06-15")).toEqual({ year: 2026, month: 6 });
  });
});

describe("applyLichCalendarParams", () => {
  it("sets year/month and ngay when not today", () => {
    const next = applyLichCalendarParams(new URLSearchParams(), {
      iso: "2026-06-15",
      year: 2026,
      month: 6,
      todayIso: "2026-06-07",
    });
    expect(next.get("ngay")).toBe("2026-06-15");
    expect(next.get("year")).toBe("2026");
    expect(next.get("month")).toBe("6");
  });

  it("drops ngay when iso is today", () => {
    const next = applyLichCalendarParams(new URLSearchParams("ngay=2026-06-07"), {
      iso: "2026-06-07",
      year: 2026,
      month: 6,
      todayIso: "2026-06-07",
    });
    expect(next.has("ngay")).toBe(false);
  });
});

describe("resolveLichViewYm", () => {
  it("prefers ngay month over year/month query", () => {
    expect(resolveLichViewYm("2026-06-15", "2025", "3", true)).toEqual({
      year: 2026,
      month: 6,
    });
  });

  it("uses year/month when no ngay param", () => {
    expect(resolveLichViewYm("2026-06-07", "2025", "3", false)).toEqual({
      year: 2025,
      month: 3,
    });
  });
});

describe("hasValidLichNgayParam", () => {
  it("validates iso shape", () => {
    expect(hasValidLichNgayParam("2026-06-15")).toBe(true);
    expect(hasValidLichNgayParam("bad")).toBe(false);
    expect(hasValidLichNgayParam(null)).toBe(false);
  });
});

describe("parseLichViewMonth", () => {
  it("parses valid year and month", () => {
    expect(parseLichViewMonth("2025", "3")).toEqual({ year: 2025, month: 3 });
  });

  it("rejects invalid values", () => {
    expect(parseLichViewMonth("abc", "3")).toBeNull();
    expect(parseLichViewMonth("2025", "13")).toBeNull();
    expect(parseLichViewMonth(null, "3")).toBeNull();
  });
});
