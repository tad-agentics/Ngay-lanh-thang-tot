import type { ReactNode } from "react";
import { Link } from "react-router";

import { CT } from "~/lib/c-tokens";

export const DAY_LUAN_DAT_LICH_CTA =
  "Đặt lịch để xem chi tiết ngày hôm nay";

/** Direction C Secondary — khớp Design System + Bát tự paywall. */
export const DAY_LUAN_SECONDARY_BTN_CLASS =
  "flex w-full cursor-pointer border bg-transparent px-3.5 py-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]";

type DayLuanPaywallBlurProps = {
  children: ReactNode;
  className?: string;
  minHeight?: number;
  /** Mặc định: điều hướng `/dat-lich`. */
  onCtaClick?: () => void;
  ctaTo?: string;
};

export function DayLuanPaywallBlur({
  children,
  className = "",
  minHeight = 120,
  onCtaClick,
  ctaTo = "/dat-lich",
}: DayLuanPaywallBlurProps) {
  const cta = onCtaClick ? (
    <button
      type="button"
      onClick={onCtaClick}
      className={`${DAY_LUAN_SECONDARY_BTN_CLASS} items-center justify-center`}
      style={{ borderColor: CT.goldDeep, color: CT.ink }}
    >
      {DAY_LUAN_DAT_LICH_CTA}
    </button>
  ) : (
    <Link
      to={ctaTo}
      className={`${DAY_LUAN_SECONDARY_BTN_CLASS} items-center justify-center no-underline`}
      style={{ borderColor: CT.goldDeep, color: CT.ink }}
    >
      {DAY_LUAN_DAT_LICH_CTA}
    </Link>
  );

  return (
    <div className={`relative mt-3 ${className}`.trim()} style={{ minHeight }}>
      <div
        className="select-none"
        style={{
          filter: "blur(5px)",
          WebkitFilter: "blur(5px)",
        }}
        aria-hidden
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(240,236,226,0.15) 0%, rgba(240,236,226,0.72) 55%, ${CT.paper} 100%)`,
        }}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 z-10 pt-10 px-0">{cta}</div>
    </div>
  );
}
