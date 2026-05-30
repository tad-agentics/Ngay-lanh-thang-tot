import type { ReactNode } from "react";

import { LogoMark, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

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

type CBaziNlttLuanProseProps = {
  text?: string | null;
  loading?: boolean;
  loadingMessage?: string;
  /** Lá số đã có nhưng luận giải trống (Edge/LLM lỗi hoặc rate limit). */
  failed?: boolean;
  failedMessage?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
};

function CBaziNlttLuanParagraphs({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    return (
      <p
        className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap"
        style={{ color: CT.ink2 }}
      >
        {text}
      </p>
    );
  }
  return (
    <div className="mt-1 space-y-3">
      {paragraphs.map((para) => (
        <p
          key={para.slice(0, 48)}
          className="text-[14px] leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          {para}
        </p>
      ))}
    </div>
  );
}

/** DeepSeek luận giải trong màn Bát Tự — logo NLTT + kicker + nội dung. */
export function CBaziNlttLuanProse({
  text,
  loading = false,
  loadingMessage = "Đang luận giải…",
  failed = false,
  failedMessage = "Chưa tải được luận giải. Thử lại sau vài giây.",
  onRetry,
  className = "mt-3",
  compact = false,
}: CBaziNlttLuanProseProps) {
  const hasText = Boolean(text?.trim());
  if (!loading && !hasText && !failed) return null;

  const kicker = loading ? "NLTT đang luận…" : "NLTT luận";

  return (
    <CBaziNlttLuanRow kicker={kicker} className={className} compact={compact}>
      {loading && !hasText ? (
        <p
          className="mt-1 font-serif text-sm italic leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          {loadingMessage}
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
        <CBaziNlttLuanParagraphs text={text!.trim()} />
      )}
    </CBaziNlttLuanRow>
  );
}
