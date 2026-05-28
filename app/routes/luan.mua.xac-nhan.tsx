import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { PayCheckoutSheet } from "~/components/PayCheckoutSheet";
import { Mono } from "~/components/brand";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [checkoutPayload, setCheckoutPayload] =
    useState<CreatePayosCheckoutResponse | null>(null);

  useEffect(() => {
    if (!sku) {
      toast.error("Gói không hợp lệ.");
      navigate("/dat-lich", { replace: true });
    }
  }, [sku, navigate]);

  useEffect(() => {
    if (!sku || !autoStart || autoStartedRef.current || sheetOpen) return;
    autoStartedRef.current = true;
    void startCheckout();
  }, [autoStart, sheetOpen, sku]);

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
    setSheetOpen(true);
  }

  if (!sku || !pkg) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 font-serif text-sm" style={{ color: CT.muted }}>
        Đang chuyển hướng…
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col justify-end"
      style={{ background: "rgba(24,21,14,0.45)" }}
    >
      <div
        className="rounded-t-2xl px-6 pb-8 pt-3.5"
        style={{ background: CT.paper, fontFamily: "var(--serif)" }}
      >
        <div className="mb-3.5 flex justify-center">
          <span
            className="h-1 w-9 rounded-sm"
            style={{ background: "rgba(24,21,14,0.18)" }}
          />
        </div>

        <Mono className="text-[10px] tracking-[0.12em]" style={{ color: CT.muted }}>
          Mua luận giải
        </Mono>
        <h2
          className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-extrabold uppercase tracking-[-0.015em]"
          style={{ color: CT.ink }}
        >
          {pkg.title}
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: CT.muted }}>
          {pkg.subtitle}
        </p>

        <div
          className="mt-5 flex items-baseline justify-between border-y py-3.5"
          style={{ borderColor: CT.hairline }}
        >
          <span className="text-[13px]" style={{ color: CT.ink }}>
            Tổng thanh toán
          </span>
          <span
            className="font-[family-name:var(--font-display-2)] text-[22px] font-extrabold tabular-nums"
            style={{ color: CT.goldDeep }}
          >
            {pkg.priceLabel}
          </span>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void startCheckout()}
          className="mt-6 w-full cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em] disabled:opacity-60"
          style={{ background: CT.forest, color: CT.cream }}
        >
          {busy ? "Đang tạo link…" : `Thanh toán ${pkg.priceLabel}`}
        </button>

        <Link
          to="/toi"
          className="mt-3 block text-center font-serif text-[12.5px] no-underline"
          style={{ color: CT.muted }}
        >
          Quay lại
        </Link>
      </div>

      <PayCheckoutSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setCheckoutPayload(null);
        }}
        payload={checkoutPayload}
        successPath={(orderId) =>
          `/luan/mua/thanh-cong?sku=${sku}&order_id=${encodeURIComponent(orderId)}`
        }
        retryTo={`/luan/mua/xac-nhan?sku=${sku}&start=1`}
        backTo="/toi"
        onRetry={() => {
          setCheckoutPayload(null);
          setSheetOpen(false);
          void startCheckout();
        }}
      />
    </div>
  );
}
