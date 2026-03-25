import { describe, expect, it } from "vitest";

import { FEATURE_KEY_MAP, toDbFeatureKey } from "./constants";

describe("toDbFeatureKey", () => {
  it("maps Make-style keys to DB feature_key", () => {
    expect(toDbFeatureKey("ngay_chi_tiet")).toBe("day_detail");
    expect(toDbFeatureKey("lich_thang")).toBe("lich_thang_overview");
  });

  it("passes through unknown keys", () => {
    expect(toDbFeatureKey("custom_key")).toBe("custom_key");
  });

  it("FEATURE_KEY_MAP covers free-tier aliases", () => {
    expect(FEATURE_KEY_MAP["ngay_hom_nay"]).toBe("ngay_hom_nay");
    expect(FEATURE_KEY_MAP["weekly_summary"]).toBe("weekly_summary");
  });
});
