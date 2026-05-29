import { describe, expect, it } from "vitest";

import { baziPaywallLockedChapters } from "./bazi-paywall-mock";

describe("baziPaywallLockedChapters", () => {
  it("returns four structured locked chapters (§02–05) with year in van_nam mock", () => {
    const chapters = baziPaywallLockedChapters("Bính Ngọ");
    expect(chapters).toHaveLength(4);
    const tinh = chapters.find((c) => c.key === "tinh_cach");
    if (tinh?.key === "tinh_cach") {
      expect(tinh.traits).toHaveLength(4);
      expect(tinh.introProse.length).toBeGreaterThan(0);
    }
    const van = chapters.find((c) => c.key === "van_nam");
    expect(van?.key).toBe("van_nam");
    if (van?.key === "van_nam") {
      expect(van.facts.yearCanChi).toBe("Bính Ngọ");
      expect(van.facts.lifeAreas).toHaveLength(4);
      expect(van.facts.monthScores).toHaveLength(12);
    }
    const pt = chapters.find((c) => c.key === "phong_thuy");
    if (pt?.key === "phong_thuy") {
      expect(pt.facts.huongTot.length).toBeGreaterThan(0);
      expect(pt.facts.phiTinh.length).toBe(9);
    }
    const quy = chapters.find((c) => c.key === "quy_nhan");
    if (quy?.key === "quy_nhan") {
      expect(quy.quyNhan.tuoiHop.length).toBeGreaterThan(0);
      expect(quy.daiVanNext.display).toBeTruthy();
    }
  });

  it("uses generic copy when year_can_chi is empty", () => {
    const van = baziPaywallLockedChapters("").find((c) => c.key === "van_nam");
    if (van?.key === "van_nam") {
      expect(van.facts.yearCanChi).toBeNull();
      expect(van.facts.yearTheme).toContain("Năm này");
    }
  });
});
