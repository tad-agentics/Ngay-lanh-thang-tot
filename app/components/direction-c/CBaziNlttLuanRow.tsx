import { useEffect, useMemo, useState, type ReactNode } from "react";

import { LogoMark, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import {
  sanitizeNlttLuanProse,
  splitNlttLuanParagraphs,
} from "~/lib/nltt-luan-prose";

const TYPING_MS_PER_CHAR = 18;

/** Logo + 「NLTT luận」 kicker — cùng pattern `CTodayReasoning` / `CAiTypedScreen`. */
export function CBaziNlttLuanRow({
  kicker,
  children,
  className,
  compact = false,
}: {
  kicker: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const size = compact ? 26 : 32;
  const logo = compact ? 18 : 22;
  return (
    <div
      className={["flex items-start gap-3", className].filter(Boolean).join(" ")}
      style={{ gap: compact ? 10 : 12 }}
    >
      <div
        className="mt-0.5 flex shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          background: CT.forest,
        }}
      >
        <LogoMark size={logo} dark />
      </div>
      <div className="min-w-0 flex-1">
        <Mono style={{ color: CT.muted, fontSize: 9.5 }}>{kicker}</Mono>
        {children}
      </div>
    </div>
  );
}

/** Design system §13B — ink block cursor, 1s blink. */
export function CBaziNlttLuanInkCursor() {
  return (
    <>
      <span
        aria-hidden
        className="inline-block align-[-2px] ml-px"
        style={{
          width: 7,
          height: 14,
          background: CT.ink,
          animation: "b-cursor-blink 1s steps(2) infinite",
        }}
      />
      <style>{`@keyframes b-cursor-blink { 50% { opacity: 0; } }`}</style>
    </>
  );
}

function NlttLuanTypingCursor() {
  return <CBaziNlttLuanInkCursor />;
}

/** Ink block + cursor while LLM chưa trả prose (không spinner). */
export function CBaziNlttLuanInkLoading({
  message = "Đang luận giải",
  className,
  compact = false,
}: {
  message?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <CBaziNlttLuanRow
      kicker="NLTT đang luận…"
      className={className}
      compact={compact}
    >
      <p
        className="mt-1 font-serif text-[14px] italic leading-[1.6]"
        style={{ color: CT.ink2 }}
        aria-live="polite"
      >
        {message}
        <CBaziNlttLuanInkCursor />
      </p>
    </CBaziNlttLuanRow>
  );
}

function CBaziNlttLuanTypingBody({
  fullText,
  loading,
  instant,
  onTypingDoneChange,
}: {
  fullText: string;
  loading: boolean;
  instant: boolean;
  onTypingDoneChange?: (done: boolean) => void;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (instant || loading) {
      setN(fullText.length);
      return;
    }
    setN(0);
  }, [fullText, instant, loading]);

  useEffect(() => {
    if (loading || instant || !fullText || n >= fullText.length) return;
    const id = window.setTimeout(() => setN((prev) => prev + 1), TYPING_MS_PER_CHAR);
    return () => window.clearTimeout(id);
  }, [n, fullText, loading, instant]);

  const done = !loading && fullText.length > 0 && n >= fullText.length;

  useEffect(() => {
    onTypingDoneChange?.(done || instant || !fullText);
  }, [done, instant, fullText, onTypingDoneChange]);

  if (loading && !fullText) {
    return (
      <p
        className="mt-1 font-serif text-[14px] italic leading-[1.6]"
        style={{ color: CT.ink2 }}
        aria-live="polite"
      >
        Đang luận giải
        <CBaziNlttLuanInkCursor />
      </p>
    );
  }

  const visible = fullText.slice(0, Math.min(n, fullText.length));
  const paragraphs = done ? splitNlttLuanParagraphs(fullText) : null;

  if (done && paragraphs && paragraphs.length > 1) {
    return (
      <div className="mt-1 space-y-3">
        {paragraphs.map((para) => (
          <p
            key={para.slice(0, 48)}
            className="font-serif text-[14px] italic leading-[1.6]"
            style={{ color: CT.ink2 }}
          >
            {para}
          </p>
        ))}
      </div>
    );
  }

  return (
    <p
      className="mt-1 font-serif text-[14px] italic leading-[1.6] whitespace-pre-wrap"
      style={{ color: CT.ink2 }}
    >
      {visible}
      {!loading && fullText && !done ? <NlttLuanTypingCursor /> : null}
    </p>
  );
}

type CBaziNlttLuanProseProps = {
  text?: string | null;
  loading?: boolean;
  loadingMessage?: string;
  /** Skip typewriter when prose was restored from cache / already shown. */
  instant?: boolean;
  /** Lá số đã có nhưng luận giải trống (Edge/LLM lỗi hoặc rate limit). */
  failed?: boolean;
  failedMessage?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
};

/** DeepSeek luận giải trong màn Bát Tự — logo NLTT + kicker + typewriter. */
export function CBaziNlttLuanProse({
  text,
  loading = false,
  loadingMessage = "Đang luận giải…",
  instant = false,
  failed = false,
  failedMessage = "Chưa tải được luận giải. Thử lại sau vài giây.",
  onRetry,
  className = "mt-3",
  compact = false,
}: CBaziNlttLuanProseProps) {
  const fullText = useMemo(
    () => sanitizeNlttLuanProse(text?.trim() ?? ""),
    [text],
  );
  const hasText = fullText.length > 0;
  const [typingDone, setTypingDone] = useState(instant);

  useEffect(() => {
    if (instant || !hasText) setTypingDone(true);
    else setTypingDone(false);
  }, [fullText, instant, hasText]);

  if (!loading && !hasText && !failed) return null;

  const kicker =
    loading || (hasText && !typingDone) ? "NLTT đang luận…" : "NLTT luận";

  return (
    <CBaziNlttLuanRow kicker={kicker} className={className} compact={compact}>
      {loading && !hasText ? (
        <p
          className="mt-1 font-serif text-[14px] italic leading-[1.6]"
          style={{ color: CT.ink2 }}
          aria-live="polite"
        >
          {loadingMessage.replace(/…$/, "")}
          <CBaziNlttLuanInkCursor />
        </p>
      ) : failed && !hasText ? (
        <>
          <p
            className="mt-1 font-serif text-sm leading-relaxed"
            style={{ color: CT.muted }}
          >
            {failedMessage}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 cursor-pointer border bg-transparent px-3 py-1.5 font-[family-name:var(--display-2)] text-[10px] font-bold uppercase tracking-[0.06em]"
              style={{ borderColor: CT.goldDeep, color: CT.ink }}
            >
              Tải lại luận
            </button>
          ) : null}
        </>
      ) : (
        <CBaziNlttLuanTypingBody
          fullText={fullText}
          loading={loading}
          instant={instant}
          onTypingDoneChange={setTypingDone}
        />
      )}
    </CBaziNlttLuanRow>
  );
}
