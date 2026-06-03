import { useEffect, useRef, useState } from "react";

import { LogoMark, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import { NLTT_TYPING_MS_PER_CHAR } from "~/lib/nltt-typing";

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
  /** When true, CTA shows after engine tóm tắt (not only NLTT luận). Used for đặt lịch upsell. */
  showCtaWithEngineFallback?: boolean;
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
  showCtaWithEngineFallback = false,
}: CTodayReasoningProps) {
  const aiText = (text ?? "").trim();
  const engineFallback = (fallbackText ?? "").trim();
  const fullText = aiText || engineFallback;
  const isAiLuan = Boolean(aiText);
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
    const id = window.setTimeout(() => setN((prev) => prev + 1), NLTT_TYPING_MS_PER_CHAR);
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
            {loading
              ? isAiLuan
                ? "NLTT đang luận…"
                : "Đang tải…"
              : done
                ? isAiLuan
                  ? "NLTT luận"
                  : "Tóm tắt ngày"
                : isAiLuan
                  ? "NLTT đang luận…"
                  : "Đang tải…"}
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
          {done && isAiLuan ? (
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
          {done &&
          showCta &&
          onCtaClick &&
          (isAiLuan || showCtaWithEngineFallback) ? (
            <button
              type="button"
              onClick={onCtaClick}
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: CT.red,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {ctaLabel}
              </span>
              <span
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 15.5,
                  color: CT.red,
                  lineHeight: 1,
                }}
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
