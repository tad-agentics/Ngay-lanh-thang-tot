import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

import { CPayConfirmSheet } from "~/components/direction-c/CPayConfirmSheet";
import type { CreatePayosCheckoutResponse, PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

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

  useEffect(() => {
    if (!state.checkout?.order_id) {
      navigate("/dat-lich", { replace: true });
    }
  }, [navigate, state.checkout?.order_id]);

  if (!state.checkout?.order_id || !pkg) {
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
        if (!open) navigate("/dat-lich", { replace: true });
      }}
      variant="subscription"
      pkg={pkg}
      payload={state.checkout}
      retryTo="/dat-lich"
      backTo="/lich"
      onRetry={() => navigate("/dat-lich", { replace: true })}
      cancelLink={{ to: "/dat-lich", label: "Chọn gói khác" }}
    />
  );
}
