import { Mono } from "~/components/brand";
import type { PaymentRecoveryOffer } from "~/hooks/usePaymentRecovery";
import { CT } from "~/lib/c-tokens";
import { UI_PACKAGES } from "~/lib/packages";

type CPaymentRecoveryBannerProps = {
  offer: PaymentRecoveryOffer;
  checking: boolean;
  onCheck: () => void;
  onDismiss: () => void;
};

/** Shown after app resume when a pending PayOS order may still be unpaid. */
export function CPaymentRecoveryBanner({
  offer,
  checking,
  onCheck,
  onDismiss,
}: CPaymentRecoveryBannerProps) {
  const pkg = UI_PACKAGES.find((p) => p.sku === offer.packageSku);
  const label = pkg?.title ?? offer.packageSku;

  return (
    <div
      className="mx-[22px] mb-2 mt-1 border-l-[3px] px-3 py-2.5"
      style={{
        borderColor: CT.forest,
        background: "rgba(29,49,41,0.08)",
      }}
      role="status"
    >
      <Mono className="text-[9.5px] tracking-[0.14em]" style={{ color: CT.forest }}>
        THANH TOÁN ĐANG CHỜ
      </Mono>
      <p className="m-0 mt-1 font-serif text-[13px] leading-snug" style={{ color: CT.ink2 }}>
        Bạn có đơn <strong style={{ color: CT.ink }}>{label}</strong> chưa hoàn tất.
        Nếu đã chuyển khoản, hãy kiểm tra trạng thái.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={checking}
          onClick={onCheck}
          className="cursor-pointer border-none px-3 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] disabled:opacity-60"
          style={{
            background: CT.forest,
            color: CT.cream,
            fontFamily: "var(--display-2)",
          }}
        >
          {checking ? "Đang kiểm tra…" : "Kiểm tra trạng thái thanh toán"}
        </button>
        <button
          type="button"
          disabled={checking}
          onClick={onDismiss}
          className="cursor-pointer border bg-transparent px-3 py-2 font-serif text-[12.5px] disabled:opacity-60"
          style={{ borderColor: CT.hairline, color: CT.muted }}
        >
          Để sau
        </button>
      </div>
    </div>
  );
}
