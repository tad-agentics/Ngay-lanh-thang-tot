import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  CPayConfirmSheet,
  type PayCheckoutCodes,
} from "~/components/direction-c/CPayConfirmSheet";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import type { CreatePayosCheckoutResponse, PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import {
  resolvePurchaseValueVnd,
  trackMetaInitiateCheckoutOnce,
} from "~/lib/meta-pixel";
import { createPayosCheckout } from "~/lib/payos";
import { readPendingReferralCode } from "~/lib/pending-referral";
import { SUBSCRIPTION_SKUS, UI_PACKAGES } from "~/lib/packages";

type ConfirmState = {
  sku?: PackageSku;
  checkout?: CreatePayosCheckoutResponse;
};

export default function DatLichXacNhanRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ConfirmState;
  const pkg = state.sku
    ? UI_PACKAGES.find((p) => p.sku === state.sku)
    : undefined;

  const [busy, setBusy] = useState(false);
  const [checkoutPayload, setCheckoutPayload] =
    useState<CreatePayosCheckoutResponse | null>(state.checkout ?? null);

  useEffect(() => {
    if (!state.sku || !SUBSCRIPTION_SKUS.includes(state.sku)) {
      navigate("/dat-lich", { replace: true });
    }
  }, [navigate, state.sku]);

  useEffect(() => {
    if (state.checkout?.order_id) {
      setCheckoutPayload(state.checkout);
    }
  }, [state.checkout]);

  async function startCheckout(codes: PayCheckoutCodes) {
    if (!pkg) return;
    const valueVnd = resolvePurchaseValueVnd(null, pkg.sku);
    if (valueVnd) {
      trackMetaInitiateCheckoutOnce({
        packageSku: pkg.sku,
        valueVnd,
        contentName: pkg.title,
      });
    }
    setBusy(true);
    const origin = window.location.origin;
    const result = await createPayosCheckout({
      package_sku: pkg.sku,
      return_url: `${origin}/thanh-cong`,
      cancel_url: `${origin}/dat-lich/that-bai`,
      coupon_code: codes.couponCode,
      referral_code: codes.referralCode,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setCheckoutPayload(result.data);
  }

  if (!pkg) {
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
    <DirectionCScreenBoundary screen="Xác nhận đặt lịch">
      <CPayConfirmSheet
        open
        onOpenChange={(open) => {
          if (!open) navigate("/dat-lich", { replace: true });
        }}
        variant="subscription"
        pkg={pkg}
        payload={checkoutPayload}
        busy={busy}
        initialReferralCode={readPendingReferralCode()}
        onStartCheckout={(codes) => void startCheckout(codes)}
        retryTo="/dat-lich"
        backTo="/lich"
        onRetry={() => {
          setCheckoutPayload(null);
        }}
        cancelLink={{ to: "/dat-lich", label: "Chọn gói khác" }}
      />
    </DirectionCScreenBoundary>
  );
}
