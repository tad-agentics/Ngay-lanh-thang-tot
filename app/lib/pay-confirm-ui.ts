import type { PackageSku } from "~/lib/api-types";

export const PAY_CONFIRM_TIER_META: Partial<
  Record<
    PackageSku,
    { baseline: string | null; per: string; save: string | null; sub: string }
  >
> = {
  goi_1thang: {
    baseline: null,
    per: "3 tháng",
    save: null,
    sub: "Chỉ lịch · dùng thử",
  },
  goi_6thang: {
    baseline: "797.000",
    per: "6 tháng",
    save: "tiết kiệm 298.000đ",
    sub: "Lịch + luận Tiểu vận",
  },
  goi_12thang: {
    baseline: "1.097.000",
    per: "cả năm",
    save: "tiết kiệm 298.000đ",
    sub: "Toàn bộ tính năng",
  },
};

export const PAY_CONFIRM_ADDON_META: Partial<
  Record<PackageSku, { title: string; per: string; sub: string }>
> = {
  luan_bat_tu: {
    title: "Luận giải Bát tự",
    per: "một lần",
    sub: "5 chương · mệnh · tính cách · quý nhân",
  },
  luan_tieu_van: {
    title: "Luận giải Tiểu Vận",
    per: "1 năm",
    sub: "vận năm · phong thuỷ năm",
  },
};

const SUBSCRIPTION_MONTHS: Partial<Record<PackageSku, number>> = {
  goi_1thang: 3,
  goi_6thang: 6,
  goi_12thang: 12,
};

/** Preview expiry after purchase — `Dùng đến 27.05.2027`. */
export function previewSubscriptionExpiry(sku: PackageSku): string | null {
  const months = SUBSCRIPTION_MONTHS[sku];
  if (!months) return null;
  const end = new Date();
  end.setMonth(end.getMonth() + months);
  const formatted = end.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `Dùng đến ${formatted}`;
}

export function priceDisplay(label: string): string {
  return label.replace(/₫/g, "").trim();
}
