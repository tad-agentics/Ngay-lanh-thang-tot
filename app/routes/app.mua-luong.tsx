import { useState } from "react";
import { toast } from "sonner";

import { PayCheckoutSheet } from "~/components/PayCheckoutSheet";
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import type { CreatePayosCheckoutResponse, PackageSku } from "~/lib/api-types";
import { createPayosCheckout } from "~/lib/payos";
import { UI_PACKAGES } from "~/lib/packages";
import { useProfile } from "~/hooks/useProfile";
import {
  creditsBalanceFootnote,
  creditsBalanceHeadline,
} from "~/lib/subscription";

export default function AppMuaLuong() {
  const { profile, loading } = useProfile();
  const creditsFootnote = profile ? creditsBalanceFootnote(profile) : null;
  const [busySku, setBusySku] = useState<PackageSku | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [checkoutPayload, setCheckoutPayload] =
    useState<CreatePayosCheckoutResponse | null>(null);

  async function checkout(sku: PackageSku) {
    setBusySku(sku);
    const origin = window.location.origin;
    const result = await createPayosCheckout({
      package_sku: sku,
      return_url: `${origin}/app/mua-luong/thanh-cong`,
      cancel_url: `${origin}/app/mua-luong`,
    });
    setBusySku(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setCheckoutPayload(result.data);
    setSheetOpen(true);
  }

  function handleSheetOpen(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setCheckoutPayload(null);
    }
  }

  return (
    <div className="px-4 pb-8 space-y-8">
      <ScreenHeader title="Mua lượng" />

      <div>
        <p className="text-sm text-muted-foreground">
          Thanh toán qua PayOS (MoMo, VietQR, ngân hàng…). Không tự gia hạn.
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Đang tải…</p>
        ) : profile ? (
          <div className="mt-4 text-sm space-y-1">
            <p>
              Số dư hiện tại:{" "}
              <strong className="text-foreground">
                {creditsBalanceHeadline(profile)}
              </strong>
            </p>
            {creditsFootnote ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                {creditsFootnote}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <ul className="space-y-4">
        {UI_PACKAGES.map((pkg) => (
          <li
            key={pkg.sku}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
          >
            <div>
              <p className="font-medium text-foreground">{pkg.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {pkg.subtitle}
              </p>
              <p className="text-lg font-semibold text-primary mt-2">
                {pkg.priceLabel}
              </p>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={busySku !== null}
              onClick={() => void checkout(pkg.sku)}
            >
              {busySku === pkg.sku ? "Đang tạo đơn…" : "Thanh toán"}
            </Button>
          </li>
        ))}
      </ul>

      <PayCheckoutSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpen}
        payload={checkoutPayload}
      />
    </div>
  );
}
