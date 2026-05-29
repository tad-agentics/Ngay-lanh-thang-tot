/** Mono — uppercase IBM Plex Mono kicker. Used for tags, dates, labels. Min 12.5 px. */

import { type CSSProperties, type ReactNode } from "react";

export function Mono({
  children,
  style,
  className,
  size = 12.5,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--mono)",
        fontSize: size,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
