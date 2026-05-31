import { describe, expect, it } from "vitest";

import {
  hasPhongThuyLuanFromSections,
  phongThuyProseFromSections,
} from "./phong-thuy-ui";

describe("hasPhongThuyLuanFromSections", () => {
  it("detects phong_thuy_* prose", () => {
    const sections = [
      { id: "phong_thuy_van", title: "PT", text: "x".repeat(80) },
    ];
    expect(phongThuyProseFromSections(sections).length).toBeGreaterThanOrEqual(80);
    expect(hasPhongThuyLuanFromSections(sections)).toBe(true);
  });

  it("returns false for short prose", () => {
    expect(
      hasPhongThuyLuanFromSections([
        { id: "phong_thuy_van", title: "PT", text: "ngắn" },
      ]),
    ).toBe(false);
  });
});
