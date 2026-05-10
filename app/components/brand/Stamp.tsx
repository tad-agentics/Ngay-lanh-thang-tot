/** Stamp — vertical red chop / hanko seal. Decorative, aria-hidden. */

import { type CSSProperties } from "react";

export function Stamp({
  ch = "吉日",
  style,
}: {
  ch?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={{
        fontFamily: "var(--hanzi)",
        color: "#8b1a1a",
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1,
        writingMode: "vertical-rl",
        letterSpacing: 4,
        ...style,
      }}
    >
      {ch}
    </div>
  );
}
