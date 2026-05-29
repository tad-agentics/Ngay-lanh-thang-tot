import { useEffect, useRef, useState } from "react";

import { LogoMark, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";

const DEFAULT_SOURCES = ["Hiệp Kỷ Biện Phương", "Ngọc Hạp Thông Thư"] as const;

export type CTodayReasoningProps = {
  text: string | null;
  fallbackText?: string | null;
  loading?: boolean;
  /** Skip typewriter when luận was loaded from cache or already revealed once. */
  instant?: boolean;
  onTypingComplete?: () => void;
  sources?: readonly string[];
  ctaLabel?: string;
  onCtaClick?: () => void;
  showCta?: boolean;
};

export function CTodayReasoning({
  text,
  fallbackText,
  loading = false,
  instant = false,
  onTypingComplete,
  sources = DEFAULT_SOURCES,
  ctaLabel = "Hỏi tiếp về ngày này",
  onCtaClick,
  showCta = true,
}: CTodayReasoningProps) {
  const fullText = (text ?? fallbackText ?? "").trim();
  const [n, setN] = useState(0);
  const typingDoneRef = useRef(false);

  useEffect(() => {
    typingDoneRef.current = false;
    if (instant || loading) {
      setN(fullText.length);
      return;
    }
    setN(0);
  }, [fullText, instant, loading]);

  useEffect(() => {
    if (loading || instant || !fullText || n >= fullText.length) return;
    const id = window.setTimeout(() => setN((prev) => prev + 1), 18);
    return () => window.clearTimeout(id);
  }, [n, fullText, loading, instant]);

  useEffect(() => {
    if (loading || !fullText || n < fullText.length || typingDoneRef.current) return;
    typingDoneRef.current = true;
    onTypingComplete?.();
  }, [loading, fullText, n, onTypingComplete]);

  if (!fullText && !loading) return null;

  const done = !loading && fullText.length > 0 && n >= fullText.length;
  const visible = loading
    ? "Đang luận giải…"
    : fullText.slice(0, Math.min(n, fullText.length));

  return (
    <div style={{ padding: "12px 18px 14px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: CT.forest,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            overflow: "hidden",
          }}
        >
          <LogoMark dark size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Mono style={{ color: CT.muted, fontSize: 9.5 }}>
            {loading ? "NLTT đang luận…" : done ? "NLTT luận" : "NLTT đang luận…"}
          </Mono>
          <p
            style={{
              marginTop: 4,
              marginBottom: 0,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.6,
              color: CT.ink2,
            }}
          >
            {visible}
            {!loading && fullText && !done ? (
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 13,
                  background: CT.ink,
                  marginLeft: 1,
                  verticalAlign: "-2px",
                  animation: "b-cursor-blink 1s steps(2) infinite",
                }}
              />
            ) : null}
          </p>
          <style>{`@keyframes b-cursor-blink { 50% { opacity: 0; } }`}</style>
          {done ? (
            <div
              style={{
                marginTop: 10,
                fontFamily: "var(--serif)",
                fontSize: 12,
                color: CT.muted,
                lineHeight: 1.5,
              }}
            >
              Đối chiếu:{" "}
              {sources.map((s, i) => (
                <span key={s}>
                  {i > 0 ? " · " : null}
                  <span style={{ color: CT.ink2 }}>{s}</span>
                </span>
              ))}
            </div>
          ) : null}
          {done && showCta && onCtaClick ? (
            <button
              type="button"
              onClick={onCtaClick}
              className="mt-3.5 flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 border-none px-4 py-3 uppercase tracking-[0.08em]"
              style={{
                background: CT.forest,
                color: CT.cream,
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 12.5,
                boxShadow: "0 2px 10px rgba(14, 28, 20, 0.22)",
              }}
            >
              <span>{ctaLabel}</span>
              <span
                className="font-serif text-[17px] leading-none"
                style={{ color: CT.cream, opacity: 0.95 }}
                aria-hidden
              >
                ›
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
