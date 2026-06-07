import { useEffect, useRef, useState } from "react";

import { CBaziNlttLuanInkCursor } from "~/components/direction-c/CBaziNlttLuanRow";
import { CT } from "~/lib/c-tokens";
import { NLTT_TYPING_MS_PER_CHAR } from "~/lib/nltt-typing";

/** Design system §13B — ink cursor while NLTT prose is loading. */
export function CTraCuuInkLoading({
  message = "Đang luận giải",
  className = "",
  fontSize = 13,
  italic = true,
  color = CT.muted,
}: {
  message?: string;
  className?: string;
  fontSize?: number;
  italic?: boolean;
  color?: string;
}) {
  return (
    <p
      className={[
        "m-0 font-serif leading-relaxed",
        italic ? "italic" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ color, fontSize }}
      aria-live="polite"
    >
      {message}
      <CBaziNlttLuanInkCursor />
    </p>
  );
}

/** Character-by-character reveal with ink cursor — matches `CAiTypedScreen` / Lịch. */
export function CTraCuuTypingText({
  text,
  active,
  onComplete,
  className = "",
  fontSize = 13,
  color = CT.ink,
  italic = false,
}: {
  text: string;
  /** When false, full text shows immediately (restored thread / history). */
  active: boolean;
  onComplete?: () => void;
  className?: string;
  fontSize?: number;
  color?: string;
  italic?: boolean;
}) {
  const [len, setLen] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    completedRef.current = false;
    if (!active || !text) {
      setLen(text.length);
      if (text && onCompleteRef.current && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      return;
    }
    setLen(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setLen(i);
      if (i >= text.length) {
        window.clearInterval(id);
        if (onCompleteRef.current && !completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current();
        }
      }
    }, NLTT_TYPING_MS_PER_CHAR);
    return () => window.clearInterval(id);
  }, [text, active]);

  const typing = active && len < text.length;
  const visible = text.slice(0, len);

  return (
    <p
      className={[
        "m-0 font-serif leading-relaxed",
        italic ? "italic" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ color, fontSize }}
      aria-live={active ? "polite" : undefined}
    >
      {visible}
      {typing ? <CBaziNlttLuanInkCursor /> : null}
    </p>
  );
}
