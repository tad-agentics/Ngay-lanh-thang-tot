import { describe, expect, it } from "vitest";

import {
  referralRewardForPackageSku,
  REFERRAL_REWARD_BY_PACKAGE_SKU,
} from "../../supabase/functions/_shared/referral-rewards.ts";

describe("referralRewardForPackageSku", () => {
  it("maps subscription packages to VND rewards", () => {
    expect(referralRewardForPackageSku("goi_1thang")).toBe(10_000);
    expect(referralRewardForPackageSku("goi_6thang")).toBe(30_000);
    expect(referralRewardForPackageSku("goi_12thang")).toBe(50_000);
  });

  it("returns null for addon SKUs", () => {
    expect(referralRewardForPackageSku("luan_bat_tu")).toBeNull();
    expect(Object.keys(REFERRAL_REWARD_BY_PACKAGE_SKU)).toHaveLength(3);
  });
});
