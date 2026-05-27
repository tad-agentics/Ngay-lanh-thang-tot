import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Mono } from "~/components/brand";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import { useProfile } from "~/hooks/useProfile";
import type { PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { ADDON_SKUS, UI_PACKAGES } from "~/lib/packages";

const VALID_SKUS = new Set<PackageSku>(ADDON_SKUS);

export function CPaySuccessAddonScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const skuParam = searchParams.get("sku");
  const sku: PackageSku =
    skuParam && VALID_SKUS.has(skuParam as PackageSku)
      ? (skuParam as PackageSku)
      : "luan_bat_tu";
  const { profile, loading, reload } = useProfile();
  const pkg = UI_PACKAGES.find((p) => p.sku === sku);

  usePollPaymentOrderPaid(orderId, Boolean(orderId), {
    onPaid: async () => {
      await reload();
      toast.success("Đã nhận thanh toán — luận giải đã mở.");
    },
  });

  const shortOrder = orderId ? orderId.slice(-8).toUpperCase() : null;
  const baziReady = Boolean(profile?.bazi_reading_unlocked_at);
  const tieuReady =
    profile?.tieu_van_reading_expires_at != null &&
    new Date(profile.tieu_van_reading_expires_at) > new Date();

  const ctaTo =
    sku === "luan_tieu_van" ? "/toi/luan-tieu-van" : "/toi/luan-bat-tu";
  const ready = sku === "luan_tieu_van" ? tieuReady : baziReady;

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden>
          <circle
            cx="44"
            cy="44"
            r="42"
            stroke={CT.goldDeep}
            strokeWidth="1.5"
            fill="rgba(154,124,34,0.06)"
          />
          <path
            d="M28 46 L40 58 L60 32"
            stroke={CT.goldDeep}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <Mono className="mt-6 text-[10px] tracking-[0.22em]" style={{ color: CT.goldDeep }}>
          Đã thanh toán
        </Mono>
        <h2
          className="mt-2.5 max-w-[300px] font-[family-name:var(--font-display)] text-[30px] font-extrabold uppercase leading-[1.05] tracking-[-0.015em]"
          style={{ color: CT.ink }}
        >
          {pkg?.title ?? "Luận giải"}
          <br />
          <span
            className="font-serif text-[30px] font-bold normal-case not-italic tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            {ready ? "đã mở khóa" : "đang kích hoạt"}
          </span>
        </h2>
        <p className="mt-3.5 max-w-[280px] text-sm leading-snug" style={{ color: CT.ink2 }}>
          {loading
            ? "Đang xác nhận thanh toán…"
            : "Cảm ơn bạn — có thể đọc luận giải ngay trong mục Tôi."}
        </p>

        {shortOrder ? (
          <div
            className="mt-7 w-full max-w-[320px] border px-4 py-3.5 text-left"
            style={{ borderColor: CT.hairline, background: "#fff" }}
          >
            <div className="flex justify-between text-[12.5px]" style={{ color: CT.ink2 }}>
              <span>{pkg?.title}</span>
              <span>{pkg?.priceLabel}</span>
            </div>
            <div
              className="mt-1.5 flex justify-between text-[12.5px]"
              style={{ color: CT.ink2 }}
            >
              <span>Mã giao dịch</span>
              <span className="font-[family-name:var(--font-mono)] text-[11px]">
                {shortOrder}
              </span>
            </div>
          </div>
        ) : null}

        <Link
          to={ctaTo}
          className="mt-6 block w-full max-w-[320px] py-3.5 text-center font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em] no-underline"
          style={{ background: CT.forest, color: CT.cream }}
        >
          Đọc luận giải →
        </Link>

        <button
          type="button"
          onClick={() => navigate("/toi", { replace: true })}
          className="mt-3 cursor-pointer border-none bg-transparent font-serif text-sm"
          style={{ color: CT.muted }}
        >
          Về Tôi
        </button>
      </div>
    </div>
  );
}
