import { describe, expect, it } from "vitest";

import {
  landingGioLabelToGioSinh,
  parseLandingDobDdMmYyyy,
  parseLandingSignupPrefill,
} from "~/lib/landing-cta-constants";

describe("landingGioLabelToGioSinh", () => {
  it("maps Tý to 23:00 slot", () => {
    expect(landingGioLabelToGioSinh("Giờ Tý (23:00–1:00)")).toBe("23:00:00");
  });
  it("returns null for unknown", () => {
    expect(landingGioLabelToGioSinh("")).toBeNull();
    expect(landingGioLabelToGioSinh("Chưa biết giờ sinh")).toBeNull();
  });
});

describe("parseLandingDobDdMmYyyy", () => {
  it("accepts valid dd/mm/yyyy", () => {
    const r = parseLandingDobDdMmYyyy("15/08/1990");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.iso).toBe("1990-08-15");
  });

  it("rejects wrong pattern", () => {
    const r = parseLandingDobDdMmYyyy("1990-08-15");
    expect(r.ok).toBe(false);
  });

  it("rejects invalid calendar day", () => {
    const r = parseLandingDobDdMmYyyy("31/02/2020");
    expect(r.ok).toBe(false);
  });
});

describe("parseLandingSignupPrefill", () => {
  it("parses query params", () => {
    const sp = new URLSearchParams(
      "name=A+B&dob=1990-05-15&gio=Giờ+Ngọ+(11:00–13:00)&gender=nu",
    );
    const p = parseLandingSignupPrefill(sp);
    expect(p.displayName).toBe("A B");
    expect(p.ngaySinh).toBe("1990-05-15");
    expect(p.gioSinh).toBe("11:00:00");
    expect(p.gioiTinh).toBe("nu");
  });

  it("rejects invalid dob", () => {
    const sp = new URLSearchParams("dob=not-a-date&gender=nam");
    const p = parseLandingSignupPrefill(sp);
    expect(p.ngaySinh).toBeNull();
    expect(p.gioiTinh).toBe("nam");
  });
});
