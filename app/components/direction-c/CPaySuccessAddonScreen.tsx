import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Mono } from "~/components/brand";
import { PaySuccessStamp } from "~/components/direction-c/PayCommerceMarks";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import type { PackageSku } from "~/lib/api-types";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { CT } from "~/lib/c-tokens";
import {
  formatPaymentOrderRef,
  formatVndThousands,
  PAY_DISPLAY,
  PAY_DISPLAY2,
  PAY_MONO,
  subscriptionUpsellDeltaVnd,
} from "~/lib/pay-commerce-ui";
import {
  addonSubscriptionUpsell,
  PAY_CONFIRM_ADDON_META,
} from "~/lib/pay-confirm-ui";
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
  const { user } = useAuth();
  const { loading, reload } = useProfile();
  const pkg = UI_PACKAGES.find((p) => p.sku === sku);
  const addonMeta = PAY_CONFIRM_ADDON_META[sku];

  usePollPaymentOrderPaid(orderId, Boolean(orderId), {
    onPaid: async () => {
      await reload();
      toast.success("Đã nhận thanh toán — luận giải đã mở.");
    },
  });

  const orderRef = orderId ? formatPaymentOrderRef(orderId) : null;
  const receiptEmail = user?.email ?? "email của bạn";
  const subscriptionUpsell = addonSubscriptionUpsell(sku);
  const upsellDelta = subscriptionUpsell
    ? subscriptionUpsellDeltaVnd(sku, subscriptionUpsell.planSku)
    : null;

  const ctaTo =
    sku === "luan_tieu_van"
      ? `/toi/luan-tieu-van?year=${currentYearVn()}`
      : "/toi/luan-bat-tu";
  const headlineTitle = addonMeta?.title ?? pkg?.title ?? "Luận giải Bát tự";

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <PaySuccessStamp size={84} />

        <Mono className="mt-6 text-[10.5px] tracking-[0.22em]" style={{ color: CT.goldDeep }}>
          Đã mua thành công
        </Mono>
        <h2
          className="mt-2.5 max-w-[320px] text-[28.5px] font-extrabold uppercase leading-[1.05] tracking-[-0.015em]"
          style={{ ...PAY_DISPLAY, color: CT.ink }}
        >
          {headlineTitle}
          <br />
          <span
            className="font-serif text-[28.5px] font-bold italic normal-case tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            của bạn đã mở
          </span>
        </h2>
        <p className="mt-3 max-w-[300px] text-[14px] leading-snug" style={{ color: CT.ink2 }}>
          {loading ? (
            "Đang xác nhận thanh toán…"
          ) : sku === "luan_bat_tu" ? (
            <>
              Đọc được vĩnh viễn · không hết hạn. Hoá đơn đã gửi vào{" "}
              <strong className="font-semibold" style={{ color: CT.ink }}>
                {receiptEmail}
              </strong>
              .
            </>
          ) : (
            <>
              Luận giải đã mở theo gói. Hoá đơn đã gửi vào{" "}
              <strong className="font-semibold" style={{ color: CT.ink }}>
                {receiptEmail}
              </strong>
              .
            </>
          )}
        </p>

        {orderRef ? (
          <div
            className="mt-7 w-full max-w-[320px] border px-4 py-3.5 text-left"
            style={{ borderColor: CT.hairline, background: "#fff" }}
          >
            <div className="flex justify-between text-[13px]" style={{ color: CT.ink2 }}>
              <span>{headlineTitle}</span>
              <span>{addonMeta?.per ?? "một lần"}</span>
            </div>
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
          </div>
        ) : null}

        {upsellDelta != null && subscriptionUpsell ? (
          <div
            className="mt-[22px] w-full max-w-[320px] border-l-2 px-3.5 py-3 text-left"
            style={{
              background: "rgba(154,124,34,0.06)",
              borderColor: CT.goldDeep,
            }}
          >
            <Mono className="text-[9.5px]" style={{ color: CT.goldDeep }}>
              Còn thiếu
            </Mono>
            <p className="mt-1 text-[13px] leading-snug" style={{ color: CT.ink2 }}>
              {sku === "luan_tieu_van" ? (
                <>
                  Bạn chưa có{" "}
                  <strong className="font-semibold" style={{ color: CT.ink }}>
                    Lịch cá nhân
                  </strong>
                  . Gói 6 tháng gồm lịch + luận lưu niên & lưu nguyệt — chỉ thêm{" "}
                </>
              ) : (
                <>
                  Nâng lên {subscriptionUpsell.planLabel} để{" "}
                  {subscriptionUpsell.benefit} — chỉ thêm{" "}
                </>
              )}
              <strong className="font-bold" style={{ ...PAY_DISPLAY2, color: CT.goldDeep }}>
                {formatVndThousands(upsellDelta)}
              </strong>
              .
            </p>
            <Link
              to={`/dat-lich?plan=${subscriptionUpsell.planSku}`}
              className="mt-2 inline-block text-[12px] font-bold uppercase tracking-[0.06em] no-underline"
              style={{ ...PAY_DISPLAY2, color: CT.goldDeep }}
            >
              Xem chi tiết →
            </Link>
          </div>
        ) : null}

        <Link
          to={ctaTo}
          className="mt-[22px] block w-full max-w-[320px] py-3.5 text-center text-[13.5px] font-extrabold uppercase tracking-[0.08em] no-underline"
          style={{ ...PAY_DISPLAY2, background: CT.forest, color: CT.cream }}
        >
          Đọc luận giải ngay →
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
