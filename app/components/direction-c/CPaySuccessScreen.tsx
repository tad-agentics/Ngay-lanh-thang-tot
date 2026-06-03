import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Mono } from "~/components/brand";
import { PaySuccessStamp } from "~/components/direction-c/PayCommerceMarks";
import { PayTrackablePrice } from "~/components/direction-c/PayTrackablePrice";
import { useMetaPurchaseTrack } from "~/hooks/useMetaPurchaseTrack";
import { usePaymentSuccessOrder } from "~/hooks/usePaymentSuccessOrder";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import { CT } from "~/lib/c-tokens";
import { LUAN_LA_SO_BAT_TU_TITLE } from "~/lib/luan-la-so-bat-tu-labels";
import { formatSubscriptionExpiry } from "~/lib/entitlements";
import { useOrderChargeAmounts } from "~/hooks/useOrderChargeAmounts";
import {
  brandedSubscriptionPlanName,
  formatPaymentOrderRef,
  formatVndDigits,
  PAY_DISPLAY,
  PAY_DISPLAY2,
  PAY_MONO,
  subscriptionDurationLabel,
} from "~/lib/pay-commerce-ui";
import { SUBSCRIPTION_SKUS, UI_PACKAGES } from "~/lib/packages";

export function CPaySuccessScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get("order_id");
  const { user } = useAuth();
  const { profile, loading, reload } = useProfile();
  const { order, paid: paidFromOrder, trackingOrderId } = usePaymentSuccessOrder(
    orderIdFromUrl,
    user?.id,
    { packageSkus: SUBSCRIPTION_SKUS },
  );
  const [paidOverride, setPaidOverride] = useState(false);
  const paid = paidFromOrder || paidOverride;

  usePollPaymentOrderPaid(trackingOrderId, Boolean(trackingOrderId), {
    onPaid: async () => {
      await reload();
      setPaidOverride(true);
      toast.success("Đã nhận thanh toán — lịch đã được gia hạn.");
    },
  });

  const exp = formatSubscriptionExpiry(profile?.subscription_expires_at);
  const { sku, charge } = useOrderChargeAmounts(order, orderIdFromUrl);
  const planName = sku
    ? brandedSubscriptionPlanName(sku, profile?.la_so)
    : null;
  const durationLabel = sku ? subscriptionDurationLabel(sku) : null;
  const catalogPriceLabel = sku
    ? (UI_PACKAGES.find((p) => p.sku === sku)?.priceLabel ?? "799.000₫")
    : null;
  const listBaseline =
    charge?.hasDiscount && charge.listVnd != null
      ? formatVndDigits(charge.listVnd)
      : null;
  const orderRef = order?.id ? formatPaymentOrderRef(order.id) : null;
  const receiptEmail = user?.email ?? "email của bạn";

  useMetaPurchaseTrack(
    paid,
    trackingOrderId && sku && charge
      ? {
          orderId: trackingOrderId,
          packageSku: sku,
          valueVnd: charge.finalVnd,
        }
      : null,
    planName ?? undefined,
  );

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

        <Mono className="mt-[26px] text-[10.5px] tracking-[0.22em]" style={{ color: CT.goldDeep }}>
          Lịch đã mở
        </Mono>
        <h2
          className="mt-2.5 max-w-[300px] text-[30.5px] font-extrabold uppercase leading-[1.05] tracking-[-0.015em]"
          style={{ ...PAY_DISPLAY, color: CT.ink }}
        >
          Lịch của bạn
          <br />
          <span
            className="font-serif text-[30.5px] font-bold italic normal-case tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            {exp ? `đến ${exp}` : "đã kích hoạt"}
          </span>
        </h2>
        <p className="mt-3.5 max-w-[280px] text-[14.5px] leading-snug" style={{ color: CT.ink2 }}>
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

        {(order || charge) && planName && durationLabel && charge ? (
          <div
            className="mt-7 w-full max-w-[320px] border px-[18px] py-3.5 text-left"
            style={{ borderColor: CT.hairline, background: "#fff" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-left">
                <div className="text-[13px]" style={{ color: CT.ink2 }}>
                  {planName}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: CT.muted }}>
                  {durationLabel}
                </div>
              </div>
              {catalogPriceLabel ? (
                <PayTrackablePrice
                  priceLabel={catalogPriceLabel}
                  valueVnd={charge.finalVnd}
                  baseline={listBaseline}
                  size="confirm"
                  metaEventSetupId="meta-purchase-value"
                />
              ) : null}
            </div>
            {orderRef ? (
              <div
                className="mt-1.5 flex justify-between text-[13px]"
                style={{ color: CT.ink2 }}
              >
                <span>Mã giao dịch</span>
                <span
                  className="text-[11.5px] tracking-[0.04em]"
                  style={{ ...PAY_MONO, color: CT.muted }}
                >
                  {orderRef}
                </span>
              </div>
            ) : null}
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
            <Mono className="text-[9.5px]" style={{ color: CT.goldDeep }}>
              ★ Tặng kèm · gói năm
            </Mono>
            <div
              className="mt-1 text-[15.5px] font-bold uppercase tracking-[-0.005em]"
              style={{ ...PAY_DISPLAY2, color: CT.ink }}
            >
              {LUAN_LA_SO_BAT_TU_TITLE}
            </div>
            <p className="mt-1 text-xs leading-snug" style={{ color: CT.ink2 }}>
              Tính cách, vận năm, phong thuỷ, quý nhân — đã mở cho bạn.
            </p>
            <Link
              to="/toi/luan-bat-tu"
              className="mt-2.5 inline-block px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] no-underline"
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
            className="flex-1 cursor-pointer border bg-transparent px-2 py-[11px] text-[11.5px] font-bold uppercase tracking-[0.06em]"
            style={{ ...PAY_DISPLAY2, borderColor: CT.goldDeep, color: CT.ink }}
          >
            Xem hoá đơn
          </button>
          <button
            type="button"
            onClick={() => showInvoiceToast("vat")}
            className="flex-1 cursor-pointer border bg-transparent px-2 py-[11px] text-[11.5px] font-bold uppercase tracking-[0.06em]"
            style={{ ...PAY_DISPLAY2, borderColor: CT.goldDeep, color: CT.ink }}
          >
            Hoá đơn VAT
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/lich", { replace: true })}
          className="mt-4 w-full max-w-[320px] cursor-pointer border-none py-3.5 text-[13.5px] font-extrabold uppercase tracking-[0.08em]"
          style={{ ...PAY_DISPLAY2, background: CT.forest, color: CT.cream }}
        >
          Vào lịch hôm nay →
        </button>
      </div>
    </div>
  );
}
