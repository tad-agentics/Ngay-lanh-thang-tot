/**
 * Kanji — decorative CJK watermark. Always aria-hidden. Characters are picked per
 * surface (吉 / 日 / 月 / 命 / 事 / 我 / 一 / 二 / 三). Never generated dynamically.
 */

import { type CSSProperties } from "react";

export function Kanji({
  ch = "吉",
  size = 120.5,
  opacity,
  color,
  style,
  drift = false,
}: {
  ch?: string;
  size?: number;
  opacity?: number;
  color?: string;
  style?: CSSProperties;
  drift?: boolean;
}) {
  const o = opacity != null ? opacity : 0.18;
  const c = color ?? `rgba(197,165,90,${o})`;
  return (
    <span
      aria-hidden
      style={{
        fontFamily: "var(--hanzi)",
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        color: "transparent",
        WebkitTextStroke: `1px ${c}`,
        userSelect: "none",
        animation: drift ? "b-drift 22s ease-in-out infinite" : "none",
        ...style,
      }}
    >
      {ch}
    </span>
  );
}
