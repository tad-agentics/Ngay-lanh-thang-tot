import { Link } from "react-router";

import { Mono } from "~/components/brand";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { CT } from "~/lib/c-tokens";

type CPayFailureSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  retryLabel?: string;
  backTo?: string;
  backLabel?: string;
};

/** Inline failure sheet at màn 26/35 (Direction C màn 37). */
export function CPayFailureSheet({
  open,
  onOpenChange,
  onRetry,
  retryLabel = "Tạo lệnh mới",
  backTo = "/lich",
  backLabel = "Quay lại",
}: CPayFailureSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85dvh] overflow-y-auto border-t border-border p-0 gap-0"
        style={{ fontFamily: "var(--serif)" }}
      >
        <SheetHeader className="px-6 pt-5 pb-2 space-y-1 text-left">
          <SheetTitle className="sr-only">Thanh toán không thành công</SheetTitle>
          <SheetDescription className="sr-only">
            Giao dịch chưa hoàn tất — thử lại hoặc quay lại
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 text-center">
          <svg width="72" height="72" viewBox="0 0 80 80" fill="none" aria-hidden>
            <circle
              cx="40"
              cy="40"
              r="38"
              stroke={CT.red}
              strokeWidth="1.5"
              fill="rgba(163,32,31,0.05)"
            />
            <path
              d="M28 28 L52 52 M52 28 L28 52"
              stroke={CT.red}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>

          <Mono className="mt-4 text-[10px] tracking-[0.22em]" style={{ color: CT.red }}>
            Thanh toán không thành công
          </Mono>
          <h2
            className="mt-2 max-w-[300px] font-[family-name:var(--font-display)] text-[22px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
            style={{ color: CT.ink }}
          >
            Giao dịch
            <br />
            <span
              className="font-serif text-[22px] font-bold normal-case not-italic tracking-normal"
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

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onRetry();
            }}
            className="mt-6 w-full max-w-[320px] cursor-pointer border-none py-3.5 font-[family-name:var(--font-display-2)] text-[13px] font-extrabold uppercase tracking-[0.08em]"
            style={{ background: CT.forest, color: CT.cream }}
          >
            {retryLabel}
          </button>
          <Link
            to={backTo}
            onClick={() => onOpenChange(false)}
            className="mt-2.5 block w-full max-w-[320px] border py-3 text-center font-[family-name:var(--font-display-2)] text-xs font-bold uppercase tracking-[0.08em] no-underline"
            style={{ borderColor: CT.goldDeep, color: CT.ink }}
          >
            {backLabel}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
