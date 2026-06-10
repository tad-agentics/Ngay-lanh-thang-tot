import { describe, expect, it } from "vitest";

import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import { PACKAGE_AMOUNT_VND } from "~/lib/package-amount-vnd";
import {
  addonReadingsBundleVnd,
  subscriptionSixMonthBaselineVnd,
  subscriptionSixMonthCalendarBaselineVnd,
  subscriptionStarterDailyVnd,
  subscriptionStarterPerDaySubtitle,
  STARTER_SUBSCRIPTION_DAYS,
  subscriptionTierSavingsVnd,
  subscriptionYearBaselineVnd,
  subscriptionYearSavingsPercentLabel,
} from "~/lib/subscription-tier-pricing";

describe("subscription tier compare-at math", () => {
  it("starter per-day subtitle from 90-day package", () => {
    expect(subscriptionStarterDailyVnd()).toBe(
      Math.round(PACKAGE_AMOUNT_VND.goi_1thang / STARTER_SUBSCRIPTION_DAYS),
    );
    expect(subscriptionStarterPerDaySubtitle()).toBe("Chỉ 1.100 đ mỗi ngày");
  });

  it("6-month calendar baseline = 2× gói 3 tháng", () => {
    expect(subscriptionSixMonthCalendarBaselineVnd()).toBe(
      2 * PACKAGE_AMOUNT_VND.goi_1thang,
    );
  });

  it("6-month compare-at follows Tiểu vận flag", () => {
    const calendar = 2 * PACKAGE_AMOUNT_VND.goi_1thang;
    const expected = TIEU_VAN_LUAN_ENABLED
      ? calendar + PACKAGE_AMOUNT_VND.luan_tieu_van
      : calendar;
    expect(subscriptionSixMonthBaselineVnd()).toBe(expected);
  });

  it("6-month savings match sale vs baseline", () => {
    const save = subscriptionTierSavingsVnd("goi_6thang");
    expect(save).toBe(
      subscriptionSixMonthBaselineVnd() - PACKAGE_AMOUNT_VND.goi_6thang,
    );
  });

  it("yearly baseline = yearly + Luận Bát tự lẻ (luận giữ nguyên giá)", () => {
    expect(subscriptionYearBaselineVnd()).toBe(
      PACKAGE_AMOUNT_VND.goi_12thang + PACKAGE_AMOUNT_VND.luan_bat_tu,
    );
  });

  it("yearly savings and percent align", () => {
    const save = subscriptionTierSavingsVnd("goi_12thang")!;
    const baseline = subscriptionYearBaselineVnd();
    expect(save).toBe(baseline - PACKAGE_AMOUNT_VND.goi_12thang);
    const pct = Number.parseFloat(
      subscriptionYearSavingsPercentLabel().replace(",", "."),
    );
    expect(pct).toBeCloseTo((save / baseline) * 100, 1);
  });

  it("addon bundle follows Tiểu vận flag (luận giữ nguyên giá)", () => {
    const expected = TIEU_VAN_LUAN_ENABLED
      ? PACKAGE_AMOUNT_VND.luan_bat_tu + PACKAGE_AMOUNT_VND.luan_tieu_van
      : PACKAGE_AMOUNT_VND.luan_bat_tu;
    expect(addonReadingsBundleVnd()).toBe(expected);
  });
});
