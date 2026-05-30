import { describe, expect, it } from "vitest";

import {
  NGAY_SINH_DB_MIN_EXCLUSIVE,
  validateProfileNgaySinhIso,
} from "./ngay-sinh-range";

describe("validateProfileNgaySinhIso", () => {
  const today = "2026-05-30";

  it("accepts dates within range", () => {
    expect(validateProfileNgaySinhIso("1990-05-20", { todayIso: today })).toEqual({
      ok: true,
    });
    expect(
      validateProfileNgaySinhIso("1900-01-02", { todayIso: today }),
    ).toEqual({ ok: true });
  });

  it("rejects on or before min exclusive bound", () => {
    expect(validateProfileNgaySinhIso("1900-01-01", { todayIso: today })).toMatchObject({
      ok: false,
    });
    expect(validateProfileNgaySinhIso("1800-06-01", { todayIso: today })).toMatchObject({
      ok: false,
    });
  });

  it("rejects future dates", () => {
    expect(validateProfileNgaySinhIso("2026-05-31", { todayIso: today })).toMatchObject({
      ok: false,
    });
  });

  it("matches DB constant", () => {
    expect(NGAY_SINH_DB_MIN_EXCLUSIVE).toBe("1900-01-01");
  });
});
