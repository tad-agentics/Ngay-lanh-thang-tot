import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Mono } from "~/components/brand";
import { PaySuccessStamp } from "~/components/direction-c/PayCommerceMarks";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import type { PackageSku } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { formatSubscriptionExpiry } from "~/lib/entitlements";
import {
  brandedSubscriptionPlanName,
  formatPaymentOrderRef,
  PAY_DISPLAY,
  PAY_DISPLAY2,
  PAY_MONO,
  subscriptionDurationLabel,
} from "~/lib/pay-commerce-ui";
import { supabase } from "~/lib/supabase";

type OrderSummary = {
  package_sku: PackageSku;
  amount_vnd: number | null;
};

export function CPaySuccessScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { user } = useAuth();
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
  const sku = order?.package_sku ?? "goi_12thang";
  const planName = brandedSubscriptionPlanName(sku, profile?.la_so);
  const durationLabel = subscriptionDurationLabel(sku);
  const orderRef = orderId ? formatPaymentOrderRef(orderId) : null;
  const receiptEmail = user?.email ?? "email của bạn";

  function showInvoiceToast(kind: "view" | "vat") {
    toast.info(
      kind === "vat"
        ? "Hoá đơn VAT sẽ được gửi qua email sau khi PayOS xác nhận thanh toán."
        : "Hoá đơn điện tử sẽ được gửi qua email sau khi PayOS xác nhận thanh toán.",
    );
  }

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <PaySuccessStamp />

        <Mono className="mt-[26px] text-[10px] tracking-[0.22em]" style={{ color: CT.goldDeep }}>
          Lịch đã mở
        </Mono>
        <h2
          className="mt-2.5 max-w-[300px] text-[30px] font-extrabold uppercase leading-[1.05] tracking-[-0.015em]"
          style={{ ...PAY_DISPLAY, color: CT.ink }}
        >
          Lịch của bạn
          <br />
          <span
            className="font-serif text-[30px] font-bold italic normal-case tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            {exp ? `đến ${exp}` : "đã kích hoạt"}
          </span>
        </h2>
        <p className="mt-3.5 max-w-[280px] text-[14px] leading-snug" style={{ color: CT.ink2 }}>
          {loading ? (
            "Đang xác nhận thanh toán…"
          ) : paid ? (
            <>
              Hoá đơn đã gửi vào{" "}
              <strong className="font-semibold" style={{ color: CT.ink }}>
                {receiptEmail}
              </strong>
              . Cảm ơn bạn — chúc một năm an lành.
            </>
          ) : (
            "Đang chờ PayOS xác nhận — có thể mất vài phút."
          )}
        </p>
        {paid ? (
          <p className="mt-1.5 text-[12px]" style={{ color: CT.muted }}>
            Tự chuyển về lịch sau 3 giây.
          </p>
        ) : null}

        {orderRef ? (
          <div
            className="mt-7 w-full max-w-[320px] border px-[18px] py-3.5 text-left"
            style={{ borderColor: CT.hairline, background: "#fff" }}
          >
            <div className="flex justify-between text-[12.5px]" style={{ color: CT.ink2 }}>
              <span>{planName}</span>
              <span>{durationLabel}</span>
            </div>
            <div
              className="mt-1.5 flex justify-between text-[12.5px]"
              style={{ color: CT.ink2 }}
            >
              <span>Mã giao dịch</span>
              <span
                className="text-[11px] tracking-[0.04em]"
                style={{ ...PAY_MONO, color: CT.muted }}
              >
                {orderRef}
              </span>
            </div>
          </div>
        ) : null}

        {order?.package_sku === "goi_12thang" ? (
          <div
            className="mt-3.5 w-full max-w-[320px] border-l-[3px] px-4 py-3.5 text-left"
            style={{
              borderColor: CT.goldDeep,
              background: "rgba(154,124,34,0.08)",
            }}
          >
            <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
              ★ Tặng kèm · gói năm
            </Mono>
            <div
              className="mt-1 text-[15px] font-bold uppercase tracking-[-0.005em]"
              style={{ ...PAY_DISPLAY2, color: CT.ink }}
            >
              Luận giải Bát tự năm
            </div>
            <p className="mt-1 text-xs leading-snug" style={{ color: CT.ink2 }}>
              Tính cách, vận năm, phong thuỷ, quý nhân — đã mở cho bạn.
            </p>
            <Link
              to="/toi/luan-bat-tu"
              className="mt-2.5 inline-block px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] no-underline"
              style={{ ...PAY_DISPLAY2, background: CT.goldDeep, color: CT.paper }}
            >
              Đọc ngay →
            </Link>
          </div>
        ) : null}

        <div className="mt-3 flex w-full max-w-[320px] gap-2">
          <button
            type="button"
            onClick={() => showInvoiceToast("view")}
            className="flex-1 cursor-pointer border bg-transparent px-2 py-[11px] text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ ...PAY_DISPLAY2, borderColor: CT.goldDeep, color: CT.ink }}
          >
            Xem hoá đơn
          </button>
          <button
            type="button"
            onClick={() => showInvoiceToast("vat")}
            className="flex-1 cursor-pointer border bg-transparent px-2 py-[11px] text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ ...PAY_DISPLAY2, borderColor: CT.goldDeep, color: CT.ink }}
          >
            Hoá đơn VAT
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/lich", { replace: true })}
          className="mt-4 w-full max-w-[320px] cursor-pointer border-none py-3.5 text-[13px] font-extrabold uppercase tracking-[0.08em]"
          style={{ ...PAY_DISPLAY2, background: CT.forest, color: CT.cream }}
        >
          Vào lịch hôm nay →
        </button>
      </div>
    </div>
  );
}
