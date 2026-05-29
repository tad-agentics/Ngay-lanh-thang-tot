import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { CPayConfirmSheet } from "~/components/direction-c/CPayConfirmSheet";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import type { CreatePayosCheckoutResponse, PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { ADDON_SKUS, UI_PACKAGES } from "~/lib/packages";
import { createPayosCheckout } from "~/lib/payos";

const VALID_SKUS = new Set<PackageSku>(ADDON_SKUS);

type ConfirmState = {
  checkout?: CreatePayosCheckoutResponse;
};

export default function LuanMuaXacNhanRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const restoredCheckout = (location.state as ConfirmState | null)?.checkout;
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
    if (restoredCheckout?.order_id) {
      setCheckoutPayload(restoredCheckout);
    }
  }, [restoredCheckout]);

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
    <DirectionCScreenBoundary screen="Xác nhận mua luận">
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
    </DirectionCScreenBoundary>
  );
}
