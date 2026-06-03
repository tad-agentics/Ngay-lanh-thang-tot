import { useEffect, useRef } from "react";

import type { PackageSku } from "~/lib/api-types";
import { trackMetaPurchaseOnce } from "~/lib/meta-pixel";

/** Pre-resolved charge (e.g. from `useOrderChargeAmounts`) — coupon-aware. */
export type MetaPurchaseTrackPayload = {
  orderId: string;
  packageSku: PackageSku;
  valueVnd: number;
};

export function useMetaPurchaseTrack(
  paid: boolean,
  payload: MetaPurchaseTrackPayload | null | undefined,
  contentName?: string,
) {
  const firedRef = useRef(false);
  const orderId = payload?.orderId;
  const packageSku = payload?.packageSku;
  const valueVnd = payload?.valueVnd;

  useEffect(() => {
    if (!paid || !orderId || firedRef.current) return;
    const value = Math.round(valueVnd ?? 0);
    if (!Number.isFinite(value) || value <= 0 || !packageSku) return;
    firedRef.current = true;
    trackMetaPurchaseOnce({
      orderId,
      valueVnd: value,
      contentName,
      contentIds: [packageSku],
    });
  }, [paid, orderId, packageSku, valueVnd, contentName]);
}
