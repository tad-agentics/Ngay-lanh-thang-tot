import { Link, useLocation } from "react-router";

import { Mono } from "~/components/brand";
import type { PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

type ConfirmState = {
  sku?: PackageSku;
  checkoutUrl?: string;
};

export default function DatLichXacNhanRoute() {
  const location = useLocation();
  const state = (location.state ?? {}) as ConfirmState;
  const pkg = UI_PACKAGES.find((p) => p.sku === state.sku);

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

        <div className="text-[13px]" style={{ color: CT.muted }}>
          Đặt lịch
        </div>
        <h2
          className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-extrabold uppercase tracking-[-0.015em]"
          style={{ color: CT.ink }}
        >
          {pkg?.title ?? "Xác nhận gói"}
        </h2>
        {pkg ? (
          <p className="mt-1 text-[13px]" style={{ color: CT.muted }}>
            {pkg.subtitle}
          </p>
        ) : null}

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
            {pkg?.priceLabel ?? "—"}
          </span>
        </div>

        <Mono className="mt-4 block text-[10px] tracking-[0.12em]" style={{ color: CT.muted }}>
          Thanh toán qua PayOS
        </Mono>
        <p className="mt-2 text-[13px] leading-snug" style={{ color: CT.ink2 }}>
          Hoàn tất thanh toán trên cổng PayOS. Sau khi thành công, bạn sẽ được chuyển về trang
          xác nhận.
        </p>

        {state.checkoutUrl ? (
          <a
            href={state.checkoutUrl}
            className="mt-6 block w-full py-3.5 text-center font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em] no-underline"
            style={{ background: CT.forest, color: CT.cream }}
          >
            Thanh toán {pkg?.priceLabel ?? ""}
          </a>
        ) : (
          <Link
            to="/dat-lich"
            className="mt-6 block w-full py-3.5 text-center font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em] no-underline"
            style={{ background: CT.forest, color: CT.cream }}
          >
            Chọn gói
          </Link>
        )}

        <p className="mt-2.5 text-center text-[11px] leading-snug" style={{ color: CT.muted }}>
          Hoàn tiền 7 ngày · không tự gia hạn
        </p>
      </div>
    </div>
  );
}
