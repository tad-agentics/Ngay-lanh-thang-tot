import { useState } from "react";
import { toast } from "sonner";

import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import type { PackageSku } from "~/lib/api-types";
import { createPayosCheckout } from "~/lib/payos";
import { UI_PACKAGES } from "~/lib/packages";
import { useProfile } from "~/hooks/useProfile";

export default function AppMuaLuong() {
  const { profile, loading } = useProfile();
  const [busySku, setBusySku] = useState<PackageSku | null>(null);

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
    window.location.href = result.data.checkout_url;
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
          <p className="mt-4 text-sm">
            Số dư hiện tại:{" "}
            <strong className="text-foreground">{profile.credits_balance}</strong>{" "}
            lượng
            {profile.subscription_expires_at &&
            new Date(profile.subscription_expires_at) > new Date() ? (
              <span className="block mt-1 text-muted-foreground">
                Gói không giới hạn đến{" "}
                {new Date(profile.subscription_expires_at).toLocaleDateString(
                  "vi-VN",
                )}
              </span>
            ) : null}
          </p>
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
              {busySku === pkg.sku ? "Đang chuyển…" : "Thanh toán"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
