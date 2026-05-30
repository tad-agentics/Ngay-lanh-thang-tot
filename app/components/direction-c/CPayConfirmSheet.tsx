import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import QRCode from "qrcode";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Mono } from "~/components/brand";
import { CPayFailureSheet } from "~/components/direction-c/CPayFailureSheet";
import type { CreatePayosCheckoutResponse, PackageSku } from "~/lib/api-types";
import { CT, DISPLAY, DISPLAY2 } from "~/lib/c-tokens";
import { useProfile } from "~/hooks/useProfile";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import {
  PAY_CONFIRM_ADDON_META,
  PAY_CONFIRM_TIER_META,
  addonSubscriptionUpsell,
  previewSubscriptionExpiry,
  priceDisplay,
} from "~/lib/pay-confirm-ui";
import {
  formatCheckoutCountdownMs,
  PAY_CHECKOUT_TIMEOUT_MS,
} from "~/lib/pay-checkout-timeout";
import { brandedSubscriptionPlanName } from "~/lib/pay-commerce-ui";
import { formatVnd, payosBankLabel } from "~/lib/payos-display";
import { UI_PACKAGES } from "~/lib/packages";

const WARM_SCRIM = "rgba(24,21,14,0.45)";

type UiPackage = (typeof UI_PACKAGES)[number];

function PayosQrImage({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(value, {
      width: 200,
      margin: 2,
      color: { dark: "#1d3129ff", light: "#ffffffff" },
    }).then(
      (url) => {
        if (!cancelled) setDataUrl(url);
      },
      () => {
        if (!cancelled) setDataUrl(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!dataUrl) {
    return (
      <div
        className="mx-auto aspect-square w-full max-w-[200px] animate-pulse rounded-lg"
        style={{ background: "rgba(24,21,14,0.06)" }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Mã QR chuyển khoản VietQR"
      className="mx-auto w-full max-w-[200px] rounded-lg border bg-white p-2"
      style={{ borderColor: CT.hairline }}
    />
  );
}

function copyText(label: string, text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`Đã sao chép ${label}`),
    () =>
      toast.error("Không sao chép được — thử chọn và sao chép thủ công."),
  );
}

export type CPayConfirmSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "subscription" | "addon";
  pkg: UiPackage;
  payload: CreatePayosCheckoutResponse | null;
  busy?: boolean;
  onStartCheckout?: () => void;
  successPath?: (orderId: string) => string;
  retryTo?: string;
  backTo?: string;
  onRetry?: () => void;
  cancelLink?: { to: string; label: string };
};

export function CPayConfirmSheet({
  open,
  onOpenChange,
  variant,
  pkg,
  payload,
  busy = false,
  onStartCheckout,
  successPath,
  retryTo = "/dat-lich",
  backTo = "/lich",
  onRetry,
  cancelLink = { to: "/dat-lich", label: "Chọn gói khác" },
}: CPayConfirmSheetProps) {
  const navigate = useNavigate();
  const { profile, reload } = useProfile();
  const transfer = payload?.transfer ?? null;
  const orderId = payload?.order_id;
  const [failureOpen, setFailureOpen] = useState(false);
  const [countdownMs, setCountdownMs] = useState(PAY_CHECKOUT_TIMEOUT_MS);
  const openedAtRef = useRef<number | null>(null);
  const price = priceDisplay(pkg.priceLabel);
  const tierMeta = PAY_CONFIRM_TIER_META[pkg.sku];
  const addonMeta = PAY_CONFIRM_ADDON_META[pkg.sku];
  const expiryHint = previewSubscriptionExpiry(pkg.sku);
  const addonUpsell =
    variant === "addon" ? addonSubscriptionUpsell(pkg.sku) : null;
  const sheetTitle =
    variant === "subscription"
      ? brandedSubscriptionPlanName(pkg.sku, profile?.la_so)
      : (addonMeta?.title ?? pkg.title);
  const titleSizeClass = variant === "addon" ? "text-[26.5px]" : "text-[28.5px]";

  function showFailureInline() {
    onOpenChange(false);
    setFailureOpen(true);
  }

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
      setFailureOpen(false);
      setCountdownMs(PAY_CHECKOUT_TIMEOUT_MS);
    } else {
      openedAtRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !payload) return;
    const startedAt = openedAtRef.current ?? Date.now();
    const remaining = PAY_CHECKOUT_TIMEOUT_MS - (Date.now() - startedAt);
    const t = window.setTimeout(
      () => showFailureInline(),
      Math.max(0, remaining),
    );
    return () => window.clearTimeout(t);
  }, [open, payload?.order_id]);

  useEffect(() => {
    if (!open || !payload) return;
    const startedAt = openedAtRef.current ?? Date.now();
    const tick = () => {
      const left = PAY_CHECKOUT_TIMEOUT_MS - (Date.now() - startedAt);
      setCountdownMs(Math.max(0, left));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [open, payload?.order_id]);

  usePollPaymentOrderPaid(orderId, open && Boolean(orderId), {
    onPaid: async () => {
      await reload();
      toast.success("Thanh toán đã xác nhận — lịch đã được cập nhật.");
      onOpenChange(false);
      if (orderId) {
        const path = successPath
          ? successPath(orderId)
          : `/thanh-cong?order_id=${encodeURIComponent(orderId)}`;
        navigate(path, { replace: true });
      }
    },
    onGiveUp: () => showFailureInline(),
    onTerminal: () => showFailureInline(),
  });

  function confirmTransfer() {
    if (!payload) return;
    onOpenChange(false);
    const path = successPath
      ? successPath(payload.order_id)
      : `/thanh-cong?order_id=${encodeURIComponent(payload.order_id)}`;
    navigate(path, { replace: true });
  }

  function openPayosPage() {
    if (payload?.checkout_url) {
      window.open(payload.checkout_url, "_blank", "noopener,noreferrer");
    }
  }

  function handleRetry() {
    if (onRetry) {
      onRetry();
      return;
    }
    navigate(retryTo, { replace: true });
  }

  function handlePrimaryAction() {
    if (payload) {
      confirmTransfer();
      return;
    }
    onStartCheckout?.();
  }

  const eyebrow = variant === "subscription" ? "Đăng ký Lịch cát tường" : "Khai mở luận giải";
  const footerNote =
    variant === "subscription"
      ? "Hoàn tiền 7 ngày · không tự gia hạn"
      : "Hoàn tiền 7 ngày · giao dịch một lần";
  const primaryLabel = payload
    ? `Tôi đã chuyển khoản ${price}đ`
    : busy
      ? "Đang tạo lệnh…"
      : `Thanh toán ${price}đ`;

  if (!open && !failureOpen) return null;

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: WARM_SCRIM }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-confirm-title"
        >
          <button
            type="button"
            aria-label="Đóng"
            className="absolute inset-0 cursor-default border-none bg-transparent"
            onClick={() => onOpenChange(false)}
          />

          <div
            className="relative max-h-[92dvh] overflow-y-auto rounded-t-2xl px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3.5"
            style={{ background: CT.paper, fontFamily: "var(--serif)" }}
          >
            <div className="mb-3.5 flex justify-center">
              <span
                className="h-1 w-9 rounded-sm"
                style={{ background: "rgba(24,21,14,0.18)" }}
              />
            </div>

            <div className="text-[13.5px]" style={{ color: CT.muted }}>
              {eyebrow}
            </div>
            <h2
              id="pay-confirm-title"
              className={`mt-1 font-extrabold uppercase tracking-[-0.015em] ${titleSizeClass}`}
              style={{ ...DISPLAY, color: CT.ink }}
            >
              {sheetTitle}
            </h2>
            <p className="mt-1 text-[13.5px]" style={{ color: CT.muted }}>
              {variant === "subscription"
                ? (tierMeta?.sub ?? pkg.subtitle)
                : (addonMeta?.sub ?? pkg.subtitle)}
            </p>

            <div
              className="mt-5 flex items-baseline justify-between border-y py-3.5"
              style={{ borderColor: CT.hairline }}
            >
              <div>
                <div className="text-[13.5px]" style={{ color: CT.ink }}>
                  {variant === "subscription"
                    ? pkg.title
                    : (addonMeta?.title ?? pkg.title)}
                </div>
                {variant === "subscription" && expiryHint ? (
                  <div className="mt-0.5 text-[12px]" style={{ color: CT.muted }}>
                    {expiryHint}
                  </div>
                ) : variant === "addon" && addonMeta?.sub ? (
                  <div className="mt-0.5 text-[12px]" style={{ color: CT.muted }}>
                    {addonMeta.sub}
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                {tierMeta?.baseline ? (
                  <div
                    className="text-[12px] line-through"
                    style={{ color: CT.muted, textDecorationThickness: 1 }}
                  >
                    {tierMeta.baseline}đ
                  </div>
                ) : null}
                <div
                  className="text-[22.5px] font-extrabold tabular-nums tracking-[-0.015em]"
                  style={{ ...DISPLAY2, color: CT.goldDeep }}
                >
                  {price}đ
                </div>
              </div>
            </div>

            {addonUpsell ? (
              <div
                className="mt-3 border-l-2 px-3 py-2.5 text-[12.5px] leading-snug"
                style={{
                  background: "rgba(154,124,34,0.08)",
                  borderColor: CT.goldDeep,
                  color: CT.ink2,
                }}
              >
                Đổi sang{" "}
                <strong className="font-semibold" style={{ color: CT.ink }}>
                  {addonUpsell.planLabel} {priceDisplay(addonUpsell.priceLabel)}đ
                </strong>{" "}
                để {addonUpsell.benefit}.{" "}
                <Link
                  to={`/dat-lich?plan=${addonUpsell.planSku}`}
                  className="font-semibold no-underline"
                  style={{ color: CT.goldDeep }}
                >
                  Đổi gói
                </Link>
              </div>
            ) : null}

            {payload ? (
              <div
                className="mt-4 flex items-center justify-between gap-3 border px-3.5 py-3"
                style={{
                  borderColor:
                    countdownMs <= 60_000 ? "rgba(197,64,42,0.35)" : CT.hairline,
                  background:
                    countdownMs <= 60_000
                      ? "rgba(197,64,42,0.06)"
                      : "rgba(154,124,34,0.06)",
                }}
                role="timer"
                aria-live="polite"
                aria-atomic="true"
                aria-label={`Thời gian còn lại ${formatCheckoutCountdownMs(countdownMs)}`}
              >
                <Mono
                  className="text-[10.5px] tracking-[0.12em]"
                  style={{
                    color: countdownMs <= 60_000 ? CT.red : CT.muted,
                  }}
                >
                  Hoàn tất thanh toán trong
                </Mono>
                <span
                  className="text-[22px] font-extrabold tabular-nums tracking-tight"
                  style={{
                    fontFamily: "var(--mono)",
                    color: countdownMs <= 60_000 ? CT.red : CT.goldDeep,
                  }}
                >
                  {formatCheckoutCountdownMs(countdownMs)}
                </span>
              </div>
            ) : null}

            {payload && transfer ? (
              <div className="mt-4 space-y-3">
                <Mono
                  className="block text-[10.5px] tracking-[0.12em]"
                  style={{ color: CT.muted }}
                >
                  Quét mã QR hoặc chuyển khoản
                </Mono>
                <div
                  className="space-y-3 border p-4"
                  style={{ borderColor: CT.hairline, background: "#fff" }}
                >
                  {transfer.qr_code ? (
                    <>
                      <PayosQrImage value={transfer.qr_code} />
                      <button
                        type="button"
                        onClick={() => {
                          if (transfer.qr_code) {
                            copyText("mã QR", transfer.qr_code);
                          }
                        }}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 border py-2.5 text-[12.5px] font-semibold"
                        style={{ borderColor: CT.hairline, color: CT.ink }}
                      >
                        <Copy className="size-3.5 shrink-0" />
                        Sao chép mã QR
                      </button>
                    </>
                  ) : (
                    <p
                      className="py-2 text-center text-[13.5px]"
                      style={{ color: CT.muted }}
                    >
                      Không có mã QR — dùng số tài khoản bên dưới hoặc mở PayOS.
                    </p>
                  )}

                  <div className="space-y-2.5 text-[13.5px]">
                    <div>
                      <p className="text-[11.5px]" style={{ color: CT.muted }}>
                        Ngân hàng
                      </p>
                      <p className="mt-0.5 font-medium" style={{ color: CT.ink }}>
                        {payosBankLabel(transfer.bank_bin)}
                      </p>
                    </div>
                    {transfer.account_number ? (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11.5px]" style={{ color: CT.muted }}>
                            Số tài khoản
                          </p>
                          <p
                            className="mt-0.5 break-all font-medium tracking-wide"
                            style={{ fontFamily: "var(--mono)", color: CT.ink }}
                          >
                            {transfer.account_number}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Sao chép số tài khoản"
                          onClick={() => {
                            if (transfer.account_number) {
                              copyText("số tài khoản", transfer.account_number);
                            }
                          }}
                          className="shrink-0 cursor-pointer border-none bg-transparent p-1"
                          style={{ color: CT.goldDeep }}
                        >
                          <Copy className="size-4" />
                        </button>
                      </div>
                    ) : null}
                    {transfer.account_name ? (
                      <div>
                        <p className="text-[11.5px]" style={{ color: CT.muted }}>
                          Chủ tài khoản
                        </p>
                        <p
                          className="mt-0.5 font-medium uppercase"
                          style={{ color: CT.ink }}
                        >
                          {transfer.account_name}
                        </p>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-[11.5px]" style={{ color: CT.muted }}>
                        Số tiền
                      </p>
                      <p className="mt-0.5 font-medium" style={{ color: CT.ink }}>
                        {formatVnd(transfer.amount_vnd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11.5px]" style={{ color: CT.muted }}>
                        Nội dung CK
                      </p>
                      <p
                        className="mt-0.5 break-all font-medium"
                        style={{ color: CT.goldDeep }}
                      >
                        {transfer.transfer_content}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[11.5px] leading-relaxed" style={{ color: CT.muted }}>
                  Hệ thống tự động xác nhận sau khi nhận được tiền. Lệnh chuyển khoản hết hạn sau 5 phút.
                </p>
              </div>
            ) : payload ? (
              <div className="mt-4 space-y-2">
                <p className="text-[13.5px] leading-relaxed" style={{ color: CT.ink2 }}>
                  PayOS không trả chi tiết VietQR trực tiếp lúc này. Bạn có thể mở
                  trang thanh toán PayOS.
                </p>
                <button
                  type="button"
                  onClick={openPayosPage}
                  className="w-full cursor-pointer border py-2.5 text-[12.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ ...DISPLAY2, borderColor: CT.goldDeep, color: CT.ink }}
                >
                  Mở cổng PayOS
                </button>
              </div>
            ) : null}

            <div className="mt-4 text-[13px]" style={{ color: CT.muted }}>
              Thanh toán qua PayOS · VietQR
            </div>

            <button
              type="button"
              disabled={busy || (!payload && !onStartCheckout)}
              onClick={handlePrimaryAction}
              className="mt-6 w-full cursor-pointer border-none py-3.5 text-[13.5px] font-extrabold uppercase tracking-[0.08em] disabled:opacity-60"
              style={{ ...DISPLAY2, background: CT.forest, color: CT.cream }}
            >
              {primaryLabel}
            </button>

            {payload?.checkout_url ? (
              <button
                type="button"
                onClick={openPayosPage}
                className="mt-2 w-full cursor-pointer border-none bg-transparent py-1 text-[11.5px]"
                style={{ color: CT.muted }}
              >
                Mở trang thanh toán PayOS trong tab mới
              </button>
            ) : null}

            <p
              className="mt-2.5 text-center text-[11.5px] leading-relaxed"
              style={{ color: CT.muted }}
            >
              {footerNote}
            </p>

            <Link
              to={cancelLink.to}
              onClick={() => onOpenChange(false)}
              className="mt-3 block text-center text-[13px] no-underline"
              style={{ color: CT.muted }}
            >
              {cancelLink.label}
            </Link>
          </div>
        </div>
      ) : null}

      <CPayFailureSheet
        open={failureOpen}
        onOpenChange={setFailureOpen}
        onRetry={handleRetry}
        backTo={backTo}
        changeMethodTo={
          variant === "addon" && addonUpsell
            ? `/dat-lich?plan=${addonUpsell.planSku}`
            : "/dat-lich"
        }
      />
    </>
  );
}
