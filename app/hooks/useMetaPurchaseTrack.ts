import { useEffect, useRef } from "react";

import type { PackageSku } from "~/lib/api-types";
import {
  resolvePurchaseValueVnd,
  trackMetaPurchaseOnce,
} from "~/lib/meta-pixel";

export function useMetaPurchaseTrack(
  paid: boolean,
  order:
    | {
        id: string;
        package_sku: PackageSku;
        amount_vnd: number | null;
      }
    | null
    | undefined,
  contentName?: string,
) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!paid || !order?.id || firedRef.current) return;
    const valueVnd = resolvePurchaseValueVnd(order.amount_vnd, order.package_sku);
    if (valueVnd == null) return;
    firedRef.current = true;
    trackMetaPurchaseOnce({
      orderId: order.id,
      valueVnd,
      contentName,
      contentIds: [order.package_sku],
    });
  }, [paid, order, contentName]);
}
