import type { CSSProperties } from "react";
import { Link } from "react-router";

import type { LandingPrimaryCta } from "~/hooks/useLandingPrimaryCta";

type LandingPrimaryCtaLinkProps = {
  cta: Pick<LandingPrimaryCta, "disabled" | "primaryHref" | "primaryLabel" | "showPrimaryArrow">;
  className: string;
  style?: CSSProperties;
};

/** Primary landing CTA — renders non-interactive placeholder while auth resolves. */
export function LandingPrimaryCtaLink({
  cta,
  className,
  style,
}: LandingPrimaryCtaLinkProps) {
  const label = cta.showPrimaryArrow ? `${cta.primaryLabel} →` : cta.primaryLabel;

  if (cta.disabled) {
    return (
      <span
        className={className}
        style={{ ...style, opacity: 0.85, cursor: "wait" }}
        aria-disabled="true"
      >
        {label}
      </span>
    );
  }

  return (
    <Link to={cta.primaryHref} className={className} style={style}>
      {label}
    </Link>
  );
}
