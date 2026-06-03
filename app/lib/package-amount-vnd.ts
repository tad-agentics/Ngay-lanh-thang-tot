import type { PackageSku } from "~/lib/api-types";

/** List prices (VND) when `payment_orders.amount_vnd` is unavailable client-side. */
export const PACKAGE_AMOUNT_VND: Record<PackageSku, number> = {
  le: 16_000,
  goi_1thang: 299_000,
  goi_6thang: 499_000,
  goi_12thang: 799_000,
  luan_bat_tu: 299_000,
  luan_tieu_van: 199_000,
};
