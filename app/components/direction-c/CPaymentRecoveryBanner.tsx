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

const linkBtnClass =
  "cursor-pointer border-none bg-transparent p-0 font-serif text-[12px] font-semibold underline decoration-solid underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Compact strip — same pattern as CSubscriptionExpiryBanner (gold border, one line + actions). */
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
      className="mx-[22px] mb-1.5 mt-1 border-l-[3px] px-2.5 py-2"
      style={{
        borderColor: CT.goldDeep,
        background: "rgba(154,124,34,0.1)",
      }}
      role="status"
    >
      <Mono className="text-[9px] tracking-[0.14em]" style={{ color: CT.goldDeep }}>
        Thanh toán đang chờ
      </Mono>
      <p className="m-0 mt-0.5 font-serif text-[12px] leading-snug" style={{ color: CT.ink2 }}>
        Đơn <span style={{ color: CT.ink }}>{label}</span> chưa xác nhận ·{" "}
        <button
          type="button"
          disabled={checking}
          onClick={onCheck}
          className={linkBtnClass}
          style={{ color: CT.goldDeep }}
        >
          {checking ? "Đang kiểm tra…" : "Kiểm tra"}
        </button>
        <span style={{ color: CT.muted }}> · </span>
        <button
          type="button"
          disabled={checking}
          onClick={onDismiss}
          className={linkBtnClass}
          style={{ color: CT.muted, textDecoration: "none" }}
        >
          Để sau
        </button>
      </p>
    </div>
  );
}
