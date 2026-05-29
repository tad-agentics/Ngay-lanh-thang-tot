import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { CPayConfirmSheet } from "~/components/direction-c/CPayConfirmSheet";
import type { CreatePayosCheckoutResponse, PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { ADDON_SKUS, UI_PACKAGES } from "~/lib/packages";
import { createPayosCheckout } from "~/lib/payos";

const VALID_SKUS = new Set<PackageSku>(ADDON_SKUS);

export default function LuanMuaXacNhanRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skuParam = searchParams.get("sku");
  const autoStart = searchParams.get("start") === "1";
  const autoStartedRef = useRef(false);
  const sku: PackageSku | null =
    skuParam && VALID_SKUS.has(skuParam as PackageSku)
      ? (skuParam as PackageSku)
      : null;
  const pkg = sku ? UI_PACKAGES.find((p) => p.sku === sku) : null;

  const [busy, setBusy] = useState(false);
  const [checkoutPayload, setCheckoutPayload] =
    useState<CreatePayosCheckoutResponse | null>(null);

  useEffect(() => {
    if (!sku) {
      toast.error("Gói không hợp lệ.");
      navigate("/dat-lich", { replace: true });
    }
  }, [sku, navigate]);

  useEffect(() => {
    if (!sku || !autoStart || autoStartedRef.current || checkoutPayload) return;
    autoStartedRef.current = true;
    void startCheckout();
  }, [autoStart, checkoutPayload, sku]);

  async function startCheckout() {
    if (!sku) return;
    setBusy(true);
    const origin = window.location.origin;
    const result = await createPayosCheckout({
      package_sku: sku,
      return_url: `${origin}/luan/mua/thanh-cong?sku=${sku}`,
      cancel_url: `${origin}/luan/mua/that-bai?sku=${sku}`,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setCheckoutPayload(result.data);
  }

  if (!sku || !pkg) {
    return (
      <div
        className="flex min-h-full items-center justify-center px-6 font-serif text-sm"
        style={{ color: CT.muted }}
      >
        Đang chuyển hướng…
      </div>
    );
  }

  return (
    <CPayConfirmSheet
      open
      onOpenChange={(open) => {
        if (!open) navigate("/toi", { replace: true });
      }}
      variant="addon"
      pkg={pkg}
      payload={checkoutPayload}
      busy={busy}
      onStartCheckout={() => void startCheckout()}
      successPath={(orderId) =>
        `/luan/mua/thanh-cong?sku=${sku}&order_id=${encodeURIComponent(orderId)}`
      }
      retryTo={`/luan/mua/xac-nhan?sku=${sku}&start=1`}
      backTo="/toi"
      onRetry={() => {
        setCheckoutPayload(null);
        autoStartedRef.current = false;
        void startCheckout();
      }}
      cancelLink={{ to: "/toi", label: "Quay lại" }}
    />
  );
}
