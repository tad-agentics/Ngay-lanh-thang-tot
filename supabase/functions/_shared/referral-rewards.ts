/** Referral cash rewards — subscription SKUs only (VND to referrer). */

export const REFERRAL_REWARD_BY_PACKAGE_SKU = {
  goi_1thang: 10_000,
  goi_6thang: 30_000,
  goi_12thang: 50_000,
} as const;

export type ReferralRewardPackageSku = keyof typeof REFERRAL_REWARD_BY_PACKAGE_SKU;

export const REFERRAL_REWARD_TIERS: {
  package_sku: ReferralRewardPackageSku;
  label: string;
  reward_vnd: number;
}[] = [
  { package_sku: "goi_1thang", label: "Gói 3 tháng lịch", reward_vnd: 10_000 },
  { package_sku: "goi_6thang", label: "Gói 6 tháng lịch", reward_vnd: 30_000 },
  { package_sku: "goi_12thang", label: "Gói 1 năm lịch", reward_vnd: 50_000 },
];

export function referralRewardForPackageSku(
  sku: string,
): number | null {
  if (sku in REFERRAL_REWARD_BY_PACKAGE_SKU) {
    return REFERRAL_REWARD_BY_PACKAGE_SKU[
      sku as ReferralRewardPackageSku
    ];
  }
  return null;
}

export function packageSkuDisplayLabel(sku: string): string {
  const tier = REFERRAL_REWARD_TIERS.find((t) => t.package_sku === sku);
  return tier?.label ?? sku;
}
