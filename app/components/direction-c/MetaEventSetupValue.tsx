import type { CSSProperties, ReactNode } from "react";

import { formatMetaEventSetupValue } from "~/lib/meta-pixel";

type MetaEventSetupValueProps = {
  valueVnd: number;
  /** Formatted overlay for list mode (e.g. `799.000 đ`) — not used for Meta text in picker mode. */
  children?: ReactNode;
  /**
   * Stable id for Event Setup UI picker (`#meta-purchase-value`, `#meta-checkout-value`).
   * DOM text is digits-only (`799000`); `đ` is a separate aria-hidden node.
   */
  id?: string;
  /** Tooltip + human-readable hint (picker mode). */
  formattedDisplay?: string;
  style?: CSSProperties;
};

/**
 * Meta Event Setup reads the **clicked element's text** (digits only — no `299.000`).
 * Picker mode (`id`): one visible integer node for marketing to click on `/thanh-cong`.
 */
export function MetaEventSetupValue({
  valueVnd,
  children,
  id,
  formattedDisplay,
  style,
}: MetaEventSetupValueProps) {
  const text = formatMetaEventSetupValue(valueVnd);

  if (id) {
    return (
      <span className="inline-flex items-baseline justify-end whitespace-nowrap" style={style}>
        <span
          id={id}
          data-meta-event-setup-value={text}
          data-track-price-vnd={valueVnd}
          title={formattedDisplay}
          className="tabular-nums"
        >
          {text}
        </span>
        <span aria-hidden="true"> đ</span>
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
