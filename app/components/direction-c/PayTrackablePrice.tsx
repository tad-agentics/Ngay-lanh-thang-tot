import { MetaEventSetupValue } from "~/components/direction-c/MetaEventSetupValue";
import { CT, DISPLAY2 } from "~/lib/c-tokens";
import { formatVndDigits, withVndCurrency } from "~/lib/pay-commerce-ui";
import {
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
  /** Integer layer for Meta Event Setup (off only if no price shown). */
  metaEventSetup?: boolean;
  /**
   * Thank-you / confirm sheet: set so marketing can use Event Setup UI picker on the **visible price**.
   * Clicks map to digits-only text (`799000`), not `799.000 đ`.
   */
  metaEventSetupId?: string;
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

function visibleAmountDigits(
  priceLabel: string,
  displayPrice: string | undefined,
  valueVndProp: number | undefined,
): string {
  if (
    typeof valueVndProp === "number" &&
    Number.isFinite(valueVndProp) &&
    valueVndProp > 0
  ) {
    return formatVndDigits(Math.round(valueVndProp));
  }
  return priceDisplay(displayPrice ?? priceLabel);
}

function FormattedVnd({ digits }: { digits: string }) {
  return (
    <>
      {digits}
      {" "}
      <span>đ</span>
    </>
  );
}

/**
 * Price column for `/dat-lich`, pay confirm, thank-you receipt.
 * With `metaEventSetupId`, Event Setup UI picker: click the visible price → value `799000`, currency VND.
 */
export function PayTrackablePrice({
  priceLabel,
  displayPrice,
  valueVnd: valueVndProp,
  baseline,
  per,
  hero = false,
  size = "tier",
  metaEventSetup = true,
  metaEventSetupId,
}: PayTrackablePriceProps) {
  const amountDigits = visibleAmountDigits(priceLabel, displayPrice, valueVndProp);
  const baselineDigits = baseline ? priceDisplay(baseline) : null;
  const valueVnd = resolveTrackableValueVnd(valueVndProp, priceLabel);
  const classes = SIZE[size];
  const muted = hero ? "rgba(237,231,211,0.65)" : CT.muted;
  const baselineMuted = hero ? "rgba(237,231,211,0.55)" : CT.muted;
  const priceColor = hero ? CT.gold : CT.goldDeep;
  const ariaLabel = payTrackablePriceAriaLabel({
    price: amountDigits,
    baseline: baselineDigits,
    per,
  });
  const formatted = <FormattedVnd digits={amountDigits} />;

  return (
    <div
      className="text-right"
      role="group"
      aria-label={ariaLabel}
    >
      <div
        className={`${classes.price} relative`}
        style={{ ...DISPLAY2, color: priceColor }}
        data-track-price-vnd={valueVnd}
      >
        {metaEventSetup ? (
          <MetaEventSetupValue
            valueVnd={valueVnd}
            id={metaEventSetupId}
            formattedDisplay={withVndCurrency(amountDigits)}
            style={{ color: priceColor }}
          >
            {formatted}
          </MetaEventSetupValue>
        ) : (
          <span aria-hidden="true">{formatted}</span>
        )}
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
          <FormattedVnd digits={baselineDigits ?? ""} />
        </div>
      ) : null}
    </div>
  );
}
