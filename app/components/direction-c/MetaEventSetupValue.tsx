import type { CSSProperties, ReactNode } from "react";

import { formatMetaEventSetupValue } from "~/lib/meta-pixel";
import { formatVndPriceDisplay } from "~/lib/vnd-format";

type MetaEventSetupValueProps = {
  valueVnd: number;
  children?: ReactNode;
  /**
   * Stable id for Event Setup UI picker (`#meta-purchase-value`, `#meta-checkout-value`).
   * Picker reads digits-only text; visible layer uses Intl `₫` for price candidates.
   */
  id?: string;
  formattedDisplay?: string;
  style?: CSSProperties;
};

/**
 * Meta Event Setup: visible `299.000 ₫` (Intl); picker target text = `299000` only.
 */
export function MetaEventSetupValue({
  valueVnd,
  children,
  id,
  formattedDisplay,
  style,
}: MetaEventSetupValueProps) {
  const text = formatMetaEventSetupValue(valueVnd);
  const visible =
    formattedDisplay ?? formatVndPriceDisplay(valueVnd);

  if (id) {
    return (
      <span
        className="relative inline-block whitespace-nowrap text-right"
        style={style}
      >
        <span
          id={id}
          data-meta-event-setup-value={text}
          data-track-price-vnd={valueVnd}
          title={visible}
          className="absolute inset-0 z-10 opacity-0 tabular-nums"
          aria-hidden="true"
        >
          {text}
        </span>
        <span className="pointer-events-none relative z-0 tabular-nums">
          {visible}
        </span>
      </span>
    );
  }

  return (
    <>
      <span
        data-meta-event-setup-value={text}
        data-track-price-vnd={valueVnd}
        className="absolute m-[-1px] h-px w-px overflow-hidden whitespace-nowrap border-0 p-0"
        style={{ clip: "rect(0, 0, 0, 0)", clipPath: "inset(50%)" }}
        aria-hidden="true"
      >
        {text}
      </span>
      <span aria-hidden="true">{children}</span>
    </>
  );
}
