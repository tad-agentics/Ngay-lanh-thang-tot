import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Mono } from "~/components/brand";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import { useProfile } from "~/hooks/useProfile";
import type { PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { formatSubscriptionExpiry } from "~/lib/entitlements";
import { formatVnd } from "~/lib/payos-display";
import { UI_PACKAGES } from "~/lib/packages";
import { supabase } from "~/lib/supabase";

type OrderSummary = {
  package_sku: PackageSku;
  amount_vnd: number | null;
};

export function CPaySuccessScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { profile, loading, reload } = useProfile();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [paid, setPaid] = useState(false);

  usePollPaymentOrderPaid(orderId, Boolean(orderId), {
    onPaid: async () => {
      await reload();
      setPaid(true);
      toast.success("Đã nhận thanh toán — lịch đã được gia hạn.");
    },
  });

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    void supabase
      .from("payment_orders")
      .select("package_sku, amount_vnd, status")
      .eq("id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.package_sku) return;
        setOrder({
          package_sku: data.package_sku as PackageSku,
          amount_vnd: data.amount_vnd,
        });
        if (data.status === "paid") setPaid(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!paid) return;
    const t = window.setTimeout(() => {
      navigate("/lich", { replace: true });
    }, 3000);
    return () => window.clearTimeout(t);
  }, [paid, navigate]);

  const exp = formatSubscriptionExpiry(profile?.subscription_expires_at);
  const pkg =
    UI_PACKAGES.find((p) => p.sku === order?.package_sku) ??
    UI_PACKAGES.find((p) => p.sku === "goi_12thang");
  const shortOrder = orderId ? orderId.slice(-8).toUpperCase() : null;
  const amountLabel =
    order?.amount_vnd != null ? formatVnd(order.amount_vnd) : pkg?.priceLabel;

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
          Lịch đã mở
        </Mono>
        <h2
          className="mt-2.5 max-w-[300px] font-[family-name:var(--font-display)] text-[30px] font-extrabold uppercase leading-[1.05] tracking-[-0.015em]"
          style={{ color: CT.ink }}
        >
          Lịch của bạn
          <br />
          <span
            className="font-serif text-[30px] font-bold normal-case not-italic tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            {exp ? `đến ${exp}` : "đã kích hoạt"}
          </span>
        </h2>
        <p className="mt-3.5 max-w-[280px] text-sm leading-snug" style={{ color: CT.ink2 }}>
          {loading
            ? "Đang xác nhận thanh toán…"
            : paid
              ? "Cảm ơn bạn — chúc một năm an lành. Tự chuyển về lịch sau 3 giây."
              : "Đang chờ PayOS xác nhận — có thể mất vài phút."}
        </p>

        {shortOrder ? (
          <div
            className="mt-7 w-full max-w-[320px] border px-4 py-3.5 text-left"
            style={{ borderColor: CT.hairline, background: "#fff" }}
          >
            <div className="flex justify-between text-[12.5px]" style={{ color: CT.ink2 }}>
              <span>{pkg?.title ?? "Gói lịch"}</span>
              <span>{amountLabel ?? "—"}</span>
            </div>
            <div
              className="mt-1.5 flex justify-between text-[12.5px]"
              style={{ color: CT.ink2 }}
            >
              <span>Mã giao dịch</span>
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-muted">
                {shortOrder}
              </span>
            </div>
          </div>
        ) : null}

        {order?.package_sku === "goi_12thang" ? (
          <Link
            to="/toi/luan-bat-tu"
            className="mt-4 block w-full max-w-[320px] border-l-[3px] px-4 py-3.5 text-left no-underline"
            style={{
              borderColor: CT.goldDeep,
              background: "rgba(154,124,34,0.08)",
            }}
          >
            <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
              ★ Tặng kèm · gói năm
            </Mono>
            <div className="mt-1 font-[family-name:var(--font-display-2)] text-[15px] font-bold uppercase tracking-[-0.005em]">
              Luận giải Bát tự
            </div>
            <p className="mt-1 text-xs leading-snug" style={{ color: CT.ink2 }}>
              Tính cách, vận năm, phong thuỷ — đã mở nếu gói năm.
            </p>
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => navigate("/lich", { replace: true })}
          className="mt-4 w-full max-w-[320px] cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em]"
          style={{ background: CT.forest, color: CT.cream }}
        >
          Vào lịch hôm nay →
        </button>
      </div>
    </div>
  );
}
