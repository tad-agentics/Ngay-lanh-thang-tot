import { CT, DISPLAY2 } from "~/lib/c-tokens";
import { formatVndPriceDisplay } from "~/lib/pay-commerce-ui";
import {
  formatLabelWithCurrency,
  payTrackablePriceAriaLabel,
  priceDisplay,
  resolveTrackableValueVnd,
} from "~/lib/pay-confirm-ui";

type PayTrackablePriceProps = {
  priceLabel: string;
  /** Override displayed digits (e.g. checkout quote final). */
  displayPrice?: string;
  /** Override tracking value (integer VND); non-positive values fall back to `priceLabel`. */
  valueVnd?: number;
  /** Compare-at (strikethrough) — after sale price in DOM; decorative when parent `aria-label` is set. */
  baseline?: string | null;
  /** e.g. `6 tháng` → line `đ · 6 tháng` */
  per?: string;
  hero?: boolean;
  size?: "tier" | "addon" | "confirm";
};

const SIZE = {
  tier: {
    price: "text-2xl font-extrabold leading-none tabular-nums tracking-[-0.015em]",
    per: "mt-1 font-serif text-[12px]",
    baseline: "mt-1 font-serif text-xs line-through tabular-nums",
  },
  addon: {
    price: "text-[17.5px] font-extrabold leading-none tabular-nums tracking-[-0.015em]",
    per: "mt-0.5 font-serif text-[11px]",
    baseline: "mt-0.5 font-serif text-[11px] line-through tabular-nums",
  },
  confirm: {
    price: "text-[22.5px] font-extrabold tabular-nums tracking-[-0.015em]",
    per: "",
    baseline: "mt-0.5 font-serif text-[12px] line-through tabular-nums",
  },
} as const;

function visiblePriceText(
  priceLabel: string,
  displayPrice: string | undefined,
  valueVndProp: number | undefined,
): string {
  if (
    typeof valueVndProp === "number" &&
    Number.isFinite(valueVndProp) &&
    valueVndProp > 0
  ) {
    return formatVndPriceDisplay(Math.round(valueVndProp));
  }
  return formatLabelWithCurrency(displayPrice ?? priceLabel);
}

/**
 * Price column for `/dat-lich` and pay confirm.
 * Sale amount is first in DOM (Meta Event Setup); compare-at follows as decorative.
 * `data-track-price-vnd` is for GTM/manual mapping — not a documented Meta attribute.
 */
export function PayTrackablePrice({
  priceLabel,
  displayPrice,
  valueVnd: valueVndProp,
  baseline,
  per,
  hero = false,
  size = "tier",
}: PayTrackablePriceProps) {
  const priceDigits = displayPrice ?? priceDisplay(priceLabel);
  const price = visiblePriceText(priceLabel, displayPrice, valueVndProp);
  const valueVnd = resolveTrackableValueVnd(valueVndProp, priceLabel);
  const classes = SIZE[size];
  const muted = hero ? "rgba(237,231,211,0.65)" : CT.muted;
  const baselineMuted = hero ? "rgba(237,231,211,0.55)" : CT.muted;
  const priceColor = hero ? CT.gold : CT.goldDeep;
  const ariaLabel = payTrackablePriceAriaLabel({ price: priceDigits, baseline, per });

  return (
    <div
      className="text-right"
      role="group"
      aria-label={ariaLabel}
    >
      <div
        className={classes.price}
        style={{ ...DISPLAY2, color: priceColor }}
        data-track-price-vnd={valueVnd}
      >
        {price}
      </div>
      {per ? (
        <div className={classes.per} style={{ color: muted }} aria-hidden="true">
          {per}
        </div>
      ) : null}
      {baseline ? (
        <div
          className={classes.baseline}
          style={{ color: baselineMuted, textDecorationThickness: 1 }}
          aria-hidden="true"
        >
          {formatLabelWithCurrency(baseline)}
        </div>
      ) : null}
    </div>
  );
}
