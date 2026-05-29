import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { PayFailureMark } from "~/components/direction-c/PayCommerceMarks";
import { PayFailureDetails } from "~/components/direction-c/PayFailureDetails";
import { CT } from "~/lib/c-tokens";
import {
  formatPayFailureTimestamp,
  PAY_DISPLAY,
  PAY_DISPLAY2,
} from "~/lib/pay-commerce-ui";

const WARM_SCRIM = "rgba(24,21,14,0.45)";

type CPayFailureSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  retryLabel?: string;
  backTo?: string;
  backLabel?: string;
  changeMethodTo?: string;
  errorCode?: string;
  errorAt?: string;
};

/** Inline failure sheet at màn 26/35 (Direction C màn 37). */
export function CPayFailureSheet({
  open,
  onOpenChange,
  onRetry,
  retryLabel = "Tạo lệnh mới",
  backTo = "/lich",
  backLabel = "Quay lại",
  changeMethodTo = "/dat-lich",
  errorCode = "PAYOS_TIMEOUT",
  errorAt,
}: CPayFailureSheetProps) {
  if (!open) return null;

  const failureAt = errorAt ?? formatPayFailureTimestamp();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: WARM_SCRIM }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-failure-title"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 cursor-default border-none bg-transparent"
        onClick={() => onOpenChange(false)}
      />

      <div
        className="relative max-h-[92dvh] overflow-y-auto rounded-t-2xl px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5"
        style={{ background: CT.paper, fontFamily: "var(--serif)" }}
      >
        <div className="mb-3.5 flex justify-center">
          <span
            className="h-1 w-9 rounded-sm"
            style={{ background: "rgba(24,21,14,0.18)" }}
          />
        </div>

        <div className="flex flex-col items-center pt-2 text-center">
          <PayFailureMark size={72} />

          <Mono className="mt-4 text-[10px] tracking-[0.22em]" style={{ color: CT.red }}>
            Thanh toán không thành công
          </Mono>
          <h2
            id="pay-failure-title"
            className="mt-2 max-w-[300px] text-[22px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
            style={{ ...PAY_DISPLAY, color: CT.ink }}
          >
            Giao dịch
            <br />
            <span
              className="font-serif text-[22px] font-bold italic normal-case tracking-normal"
              style={{ color: CT.red }}
            >
              chưa hoàn tất
            </span>
          </h2>
          <p
            className="mt-2.5 max-w-[300px] text-[13px] leading-snug"
            style={{ color: CT.ink2 }}
          >
            Có thể số dư không đủ, bạn đã huỷ, hoặc lệnh đã hết hạn.{" "}
            <strong className="font-semibold" style={{ color: CT.ink }}>
              Lịch chưa bị trừ tiền.
            </strong>
          </p>

          <PayFailureDetails errorCode={errorCode} errorAt={failureAt} />

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onRetry();
            }}
            className="mt-6 w-full max-w-[320px] cursor-pointer border-none py-3.5 text-[13px] font-extrabold uppercase tracking-[0.08em]"
            style={{ ...PAY_DISPLAY2, background: CT.forest, color: CT.cream }}
          >
            {retryLabel}
          </button>
          <Link
            to={changeMethodTo}
            onClick={() => onOpenChange(false)}
            className="mt-2.5 block w-full max-w-[320px] border py-[13px] text-center text-xs font-bold uppercase tracking-[0.08em] no-underline"
            style={{ ...PAY_DISPLAY2, borderColor: CT.goldDeep, color: CT.ink }}
          >
            Đổi cách thanh toán
          </Link>
          <Link
            to={backTo}
            onClick={() => onOpenChange(false)}
            className="mt-2.5 block w-full max-w-[320px] py-1 text-center font-serif text-[12.5px] no-underline"
            style={{ color: CT.muted }}
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
