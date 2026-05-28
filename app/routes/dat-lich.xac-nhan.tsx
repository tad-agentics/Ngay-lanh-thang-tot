import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { PayCheckoutSheet } from "~/components/PayCheckoutSheet";
import { Mono } from "~/components/brand";
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
  const [sheetOpen, setSheetOpen] = useState(Boolean(state.checkout));

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
    <>
      <div
        className="fixed inset-0 z-30 flex flex-col justify-end"
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

          <div className="text-[13px]" style={{ color: CT.muted }}>
            Đặt lịch
          </div>
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

          <Mono
            className="mt-4 block text-[10px] tracking-[0.12em]"
            style={{ color: CT.muted }}
          >
            Quét mã QR hoặc chuyển khoản PayOS
          </Mono>
          <p className="mt-2 text-[13px] leading-snug" style={{ color: CT.ink2 }}>
            Sheet thanh toán mở bên dưới. Sau khi PayOS xác nhận, bạn sẽ về trang
            thành công.
          </p>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-6 w-full cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em]"
            style={{ background: CT.forest, color: CT.cream }}
          >
            Mở thanh toán {pkg.priceLabel}
          </button>

          <Link
            to="/dat-lich"
            className="mt-3 block text-center font-serif text-[12.5px] no-underline"
            style={{ color: CT.muted }}
          >
            Chọn gói khác
          </Link>
        </div>
      </div>

      <PayCheckoutSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        payload={state.checkout}
        retryTo="/dat-lich"
        backTo="/lich"
        onRetry={() => navigate("/dat-lich", { replace: true })}
      />
    </>
  );
}
