import type { PackageSku } from "~/lib/api-types";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import { PACKAGE_AMOUNT_VND } from "~/lib/package-amount-vnd";
import { formatVndDigits } from "~/lib/vnd-format";

const P = PACKAGE_AMOUNT_VND;

/** 6 tháng lịch = 2× gói 3 tháng (compare-at calendar-only). */
export function subscriptionSixMonthCalendarBaselineVnd(): number {
  return 2 * P.goi_1thang;
}

/** Compare-at 6 tháng: 2× gói 3T + Tiểu vận lẻ (when enabled). */
export function subscriptionSixMonthBaselineVnd(): number {
  const calendar = subscriptionSixMonthCalendarBaselineVnd();
  return TIEU_VAN_LUAN_ENABLED ? calendar + P.luan_tieu_van : calendar;
}

/** Compare-at gói năm: giá gói năm + Luận Bát tự lẻ (bài luận giữ nguyên giá). */
export function subscriptionYearBaselineVnd(): number {
  return P.goi_12thang + P.luan_bat_tu;
}

export function subscriptionTierSavingsVnd(sku: PackageSku): number | null {
  if (sku === "goi_6thang") {
    return subscriptionSixMonthBaselineVnd() - P.goi_6thang;
  }
  if (sku === "goi_12thang") {
    return subscriptionYearBaselineVnd() - P.goi_12thang;
  }
  return null;
}

export function subscriptionYearSavingsPercentLabel(): string {
  const baseline = subscriptionYearBaselineVnd();
  const save = subscriptionTierSavingsVnd("goi_12thang") ?? 0;
  if (baseline <= 0 || save <= 0) return "0";
  const pct = (save / baseline) * 100;
  return pct.toLocaleString("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Hai bản luận lẻ (Bát tự + Lưu niên) — không kèm lịch. */
export function addonReadingsBundleVnd(): number {
  return TIEU_VAN_LUAN_ENABLED
    ? P.luan_bat_tu + P.luan_tieu_van
    : P.luan_bat_tu;
}

export function formatTierSaveLabel(saveVnd: number): string {
  return `tiết kiệm ${formatVndDigits(saveVnd)} ₫`;
}

export function formatTierBaselineDigits(baselineVnd: number): string {
  return formatVndDigits(baselineVnd);
}
