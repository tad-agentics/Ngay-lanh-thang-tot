import type { ReactNode } from "react";

import { formatMetaEventSetupValue } from "~/lib/meta-pixel";

type MetaEventSetupValueProps = {
  valueVnd: number;
  /** Formatted price overlay (e.g. `799.000 đ`) — not used for Meta text. */
  children: ReactNode;
  /**
   * Stable id for Event Setup UI picker (`#meta-purchase-value`, `#meta-checkout-value`).
   * Transparent integer layer sits under the visible price; clicks on the price hit this node.
   */
  id?: string;
};

/**
 * Meta Event Setup reads the **clicked element's text**.
 * Picker mode: marketing clicks the visible price; DOM value is digits-only (`799000`).
 */
export function MetaEventSetupValue({
  valueVnd,
  children,
  id,
}: MetaEventSetupValueProps) {
  const text = formatMetaEventSetupValue(valueVnd);

  if (id) {
    return (
      <span className="relative inline-grid">
        <span
          id={id}
          data-meta-event-setup-value={text}
          data-track-price-vnd={valueVnd}
          className="col-start-1 row-start-1 inline-block whitespace-nowrap"
          style={{ color: "transparent" }}
          aria-hidden="true"
        >
          {text}
        </span>
        <span
          className="pointer-events-none col-start-1 row-start-1 inline-flex items-baseline justify-end whitespace-nowrap"
          aria-hidden="true"
        >
          {children}
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
