/**
 * AiReadingBlock — AR-01..AR-06
 * Forest-default. Used in all AI reading surfaces.
 *
 * AR-01: 4-phase staged loader
 * AR-02: typed-reveal on first load
 * AR-03: sectioned card (Luận / Nên / Tránh + citation chips)
 * AR-04: locked state with blurred preview + unlock CTA
 * AR-05: section retry + depth badges
 * AR-06: pin + share-just-reading actions
 */
import { useEffect, useRef, useState } from "react";

import { Ticket } from "~/components/brand";
import type { LaSoChiTietSection } from "~/lib/generate-reading";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StructuredReading {
  luan: string;
  khuyen: string[];
  tranh: string[];
  citations: string[];
}

type Variant = "on-surface" | "on-card" | "forest";

interface AiReadingBlockProps {
  title?: string;
  showTitle?: boolean;
  loading: boolean;
  /** Single-paragraph reading (legacy / simple surfaces). */
  text?: string | null;
  /** Structured Luận / Nên / Tránh reading (AR-03). */
  structuredReading?: StructuredReading | null;
  /** Lá số chi tiết 5-aspect sections (AR-05). */
  sections?: LaSoChiTietSection[] | null;
  variant?: Variant;
  emptyLabel?: string;
  // AR-04
  locked?: boolean;
  onUnlock?: () => void;
  unlockCost?: number | null;
  unlockBusy?: boolean;
  // AR-05
  onRetry?: (sectionId?: string) => void;
  retryBusy?: boolean;
  // AR-06
  scope?: string;
  dayIso?: string | null;
  isPinned?: boolean;
  onPin?: () => void;
  onShare?: () => void;
  pinBusy?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LOADING_PHASES = [
  { label: "Đang đọc Bát Tự…", sub: "Mệnh · 4 trụ · ngũ hành" },
  { label: "Đối chiếu Đại Vận…", sub: "Vận lớn 10 năm hiện tại" },
  { label: "Soi can chi của ngày…", sub: "Can chi · Trực · Sao" },
  { label: "Đang luận giải…", sub: "Hợp với mệnh của bạn" },
];

const TYPED_SPEED_MS = 14;

// ─── Sub-components ──────────────────────────────────────────────────────────

function AR01Loader({ phase, onTicket = false }: { phase: number; onTicket?: boolean }) {
  const counterColor = onTicket ? "#9a7c22" : "rgba(197,165,90,0.65)";
  const labelColor = onTicket ? "#18150e" : "var(--cream, #ede7d3)";
  const subColor = onTicket ? "#5a4f30" : "rgba(200,188,152,0.65)";
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{ padding: onTicket ? "32px 22px 28px" : "16px 0", textAlign: onTicket ? "center" : "left" }}
    >
      {/* Phase progress bars */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {LOADING_PHASES.map((_, i) => (
          <div
            key={i}
            style={{
              flex: i === phase ? 2 : 1,
              height: 3,
              background:
                i < phase
                  ? "rgba(197,165,90,0.8)"
                  : i === phase
                    ? "var(--gold, #c5a55a)"
                    : "rgba(197,165,90,0.15)",
              transition: "all 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Phase label */}
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: counterColor,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {String(phase + 1).padStart(2, "0")} / {LOADING_PHASES.length}
      </div>
      <div
        style={{
          fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
          fontWeight: 700,
          fontSize: 22,
          color: labelColor,
          lineHeight: 1.15,
        }}
      >
        {LOADING_PHASES[phase].label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif, 'Lora', serif)",
          fontStyle: "italic",
          fontSize: 13,
          color: subColor,
          marginTop: 4,
        }}
      >
        {LOADING_PHASES[phase].sub}
      </div>

      {/* Dot indicator */}
      <div style={{ display: "flex", gap: 6, marginTop: 16, justifyContent: onTicket ? "center" : "flex-start" }}>
        {LOADING_PHASES.map((_, i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background:
                i <= phase
                  ? "var(--gold, #c5a55a)"
                  : "rgba(122,112,80,0.25)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Typed-reveal cursor effect for the first load. */
function useTypedReveal(text: string, active: boolean) {
  const [n, setN] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || n >= text.length) return;
    timerRef.current = setTimeout(() => setN((prev) => prev + 1), TYPED_SPEED_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, n, text.length]);

  useEffect(() => {
    if (active) setN(0);
  }, [active, text]);

  return { displayed: text.slice(0, n), done: n >= text.length };
}

/** Blurred locked preview */
function LockedPreview({
  previewText,
  cost,
  onUnlock,
  unlockBusy,
  onTicket = false,
}: {
  previewText: string;
  cost: number | null;
  onUnlock?: () => void;
  unlockBusy?: boolean;
  onTicket?: boolean;
}) {
  const textCol = onTicket ? "#18150e" : "var(--cream, #ede7d3)";
  const gradOverlay = onTicket
    ? "linear-gradient(180deg, rgba(237,231,211,0) 0%, rgba(237,231,211,0.85) 75%)"
    : "linear-gradient(180deg, rgba(29,49,41,0) 0%, rgba(29,49,41,0.92) 75%)";
  const costLabelCol = onTicket ? "#9a7c22" : "rgba(197,165,90,0.7)";
  const costAmtCol = onTicket ? "#18150e" : "var(--cream, #ede7d3)";
  const subCol = onTicket ? "#5a4f30" : "rgba(200,188,152,0.65)";
  const btnBg = onTicket ? "#18150e" : "var(--cream, #ede7d3)";
  const btnColor = onTicket ? "#ede7d3" : "#18150e";
  return (
    <div>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <p
          style={{
            fontFamily: "var(--serif, 'Lora', serif)",
            fontSize: 14,
            lineHeight: 1.65,
            color: textCol,
            filter: "blur(4px)",
            userSelect: "none",
            margin: 0,
          }}
        >
          {previewText || "Luận giải đang chờ mở khóa — nhấn bên dưới để xem."}
        </p>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: gradOverlay,
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "12px 14px",
          background: "rgba(197,165,90,0.1)",
          border: "1px solid rgba(197,165,90,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: costLabelCol,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              display: "block",
            }}
          >
            Mở khóa
          </span>
          <span
            style={{
              fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
              fontWeight: 800,
              fontSize: 18,
              color: costAmtCol,
            }}
          >
            {cost != null ? `${cost} lượng` : "—"}
          </span>
          <span
            style={{
              fontFamily: "var(--serif, 'Lora', serif)",
              fontStyle: "italic",
              fontSize: 11,
              color: subCol,
              display: "block",
              marginTop: 1,
            }}
          >
            Đọc nhiều lần · cả ngày
          </span>
        </div>
        <button
          type="button"
          disabled={unlockBusy}
          onClick={onUnlock}
          style={{
            background: btnBg,
            color: btnColor,
            border: "none",
            padding: "10px 18px",
            fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: unlockBusy ? "default" : "pointer",
            opacity: unlockBusy ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {unlockBusy ? "Đang xử lý…" : "Mở khóa"}
        </button>
      </div>
    </div>
  );
}

/** Sectioned card: Luận / Nên / Tránh + citations */
function SectionedCard({
  sr,
  onShare,
  onPin,
  isPinned,
  pinBusy,
  onTicket = false,
}: {
  sr: StructuredReading;
  onShare?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  pinBusy?: boolean;
  onTicket?: boolean;
}) {
  const bodyColor = onTicket ? "#18150e" : "var(--cream, #ede7d3)";
  const headerLabelColor = onTicket ? "#7a7050" : "rgba(200,188,152,0.65)";
  const listItemColor = onTicket ? "#18150e" : "rgba(237,231,211,0.9)";
  const citationLabelColor = onTicket ? "#7a7050" : "rgba(197,165,90,0.55)";
  const citationChipColor = onTicket ? "#9a7c22" : "rgba(197,165,90,0.85)";
  return (
    <div style={{ position: "relative" }}>
      {/* 論 Luận */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: "var(--hanzi)",
              fontSize: 16,
              color: "rgba(197,165,90,0.8)",
              fontWeight: 700,
            }}
          >
            論
          </span>
          <span
            style={{
              fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
              fontWeight: 800,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: headerLabelColor,
            }}
          >
            Luận
          </span>
        </div>
        <p
          style={{
            fontFamily: "var(--serif, 'Lora', serif)",
            fontSize: 15,
            lineHeight: 1.68,
            color: bodyColor,
            margin: 0,
          }}
        >
          {sr.luan}
        </p>
      </div>

      {/* Nên làm */}
      {sr.khuyen.length > 0 && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px dashed rgba(122,112,80,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 14,
                background: "#3d6b4a",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
                fontWeight: 800,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#3d8a4f",
              }}
            >
              Nên làm
            </span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {sr.khuyen.map((k, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  fontFamily: "var(--serif, 'Lora', serif)",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: listItemColor,
                  padding: "3px 0",
                }}
              >
                <span
                  style={{
                    color: "#3d8a4f",
                    fontWeight: 700,
                    flexShrink: 0,
                    fontSize: 12,
                    marginTop: 1,
                  }}
                >
                  ✓
                </span>
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tránh làm */}
      {sr.tranh.length > 0 && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px dashed rgba(122,112,80,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 14,
                background: "#8b1a1a",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
                fontWeight: 800,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#b84040",
              }}
            >
              Tránh làm
            </span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {sr.tranh.map((t, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  fontFamily: "var(--serif, 'Lora', serif)",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: listItemColor,
                  padding: "3px 0",
                }}
              >
                <span
                  style={{
                    color: "#b84040",
                    fontWeight: 700,
                    flexShrink: 0,
                    fontSize: 12,
                    marginTop: 1,
                  }}
                >
                  ✕
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citations */}
      {sr.citations.length > 0 && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid rgba(122,112,80,0.2)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: citationLabelColor,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 6,
            }}
          >
            Dựa trên
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {sr.citations.map((c, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: citationChipColor,
                  letterSpacing: "0.04em",
                  padding: "2px 8px",
                  border: "1px solid rgba(197,165,90,0.35)",
                  background: "rgba(197,165,90,0.07)",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AR-06: Pin + Share actions */}
      {(onPin || onShare) && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px dashed rgba(122,112,80,0.3)",
            display: "flex",
            gap: 8,
          }}
        >
          {onPin && (
            <button
              type="button"
              disabled={pinBusy}
              onClick={onPin}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: isPinned
                  ? "rgba(139,26,26,0.18)"
                  : "rgba(197,165,90,0.08)",
                border: `1px solid ${isPinned ? "rgba(139,26,26,0.5)" : "rgba(197,165,90,0.3)"}`,
                padding: "7px 12px",
                cursor: pinBusy ? "default" : "pointer",
                opacity: pinBusy ? 0.65 : 1,
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: isPinned ? "#c07070" : "rgba(197,165,90,0.85)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ fontFamily: "var(--hanzi)", fontSize: 13, fontWeight: 700 }}>
                留
              </span>
              <span>{isPinned ? "Bỏ ghim" : "Ghim"}</span>
            </button>
          )}
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(197,165,90,0.08)",
                border: "1px solid rgba(197,165,90,0.3)",
                padding: "7px 12px",
                cursor: "pointer",
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "rgba(197,165,90,0.85)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Chia sẻ
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** AR-05: LaSo section list with collapse/expand and retry */
function LaSoSectionList({
  sections,
  onRetry,
  retryBusy,
}: {
  sections: LaSoChiTietSection[];
  onRetry?: (id: string) => void;
  retryBusy?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sections.map((s, idx) => {
        const isOpen = openId === s.id;
        const hasError = !s.text?.trim();

        return (
          <div
            key={s.id}
            style={{
              background: "var(--cream, #ede7d3)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 15px",
                width: "100%",
                background: "transparent",
                border: "none",
                borderLeft: hasError
                  ? "3px solid #8b1a1a"
                  : isOpen
                    ? "3px solid var(--gold, #c5a55a)"
                    : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: hasError ? "#8b1a1a" : "rgba(197,165,90,0.8)",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    minWidth: 22,
                  }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--display-2, 'Barlow Condensed', sans-serif)",
                      fontWeight: 800,
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "#18150e",
                    }}
                  >
                    {s.title}
                  </div>
                  {hasError && (
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 9,
                        color: "#8b1a1a",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                      }}
                    >
                      Lỗi tải
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 14,
                  color: "#7a7050",
                }}
              >
                {isOpen ? "–" : "+"}
              </span>
            </button>

            {isOpen && s.text?.trim() && (
              <div style={{ padding: "0 15px 12px 39px" }}>
                <p
                  style={{
                    fontFamily: "var(--serif, 'Lora', serif)",
                    fontSize: 13,
                    lineHeight: 1.62,
                    color: "#3a3220",
                    margin: 0,
                  }}
                >
                  {s.text}
                </p>
              </div>
            )}

            {hasError && (
              <div
                style={{
                  padding: "4px 15px 12px 39px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--serif, 'Lora', serif)",
                    fontStyle: "italic",
                    fontSize: 12,
                    color: "#8b1a1a",
                  }}
                >
                  Mạng chậm hoặc bot quá tải. Các mục khác vẫn dùng được.
                </span>
                {onRetry && (
                  <button
                    type="button"
                    disabled={retryBusy}
                    onClick={() => onRetry(s.id)}
                    style={{
                      background: "#8b1a1a",
                      color: "#ede7d3",
                      border: "none",
                      padding: "6px 11px",
                      fontFamily:
                        "var(--display-2, 'Barlow Condensed', sans-serif)",
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      cursor: retryBusy ? "default" : "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {retryBusy ? "…" : "Thử lại"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiReadingBlock({
  title = "Luận giải",
  showTitle = true,
  loading,
  text = null,
  structuredReading = null,
  sections = null,
  variant = "on-card",
  emptyLabel = "Luận giải tự động tạm chưa tải được. Thử làm mới trang hoặc quay lại sau.",
  locked = false,
  onUnlock,
  unlockCost = null,
  unlockBusy = false,
  onRetry,
  retryBusy = false,
  isPinned = false,
  onPin,
  onShare,
  pinBusy = false,
}: AiReadingBlockProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [revealActive, setRevealActive] = useState(false);
  const prevLoadingRef = useRef(loading);

  // Track when loading starts
  useEffect(() => {
    if (loading) {
      setHasStarted(true);
      setPhaseIndex(0);
    }
  }, [loading]);

  // Cycle phases during loading
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(
      () =>
        setPhaseIndex((prev) => Math.min(prev + 1, LOADING_PHASES.length - 1)),
      1600,
    );
    return () => clearInterval(id);
  }, [loading]);

  // Trigger typed reveal when loading completes
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;
    if (wasLoading && !loading) {
      setRevealActive(true);
    }
  }, [loading]);

  const primaryText = text?.trim() ?? "";
  const sectionList = sections?.filter((s) => s.text?.trim()) ?? [];
  const hasSections = sectionList.length > 0;
  const hasStructured = structuredReading != null;

  const typedTarget =
    !hasStructured && !hasSections ? primaryText : "";
  const { displayed, done } = useTypedReveal(typedTarget, revealActive);

  // When typed reveal finishes, deactivate
  useEffect(() => {
    if (done && revealActive) {
      setRevealActive(false);
    }
  }, [done, revealActive]);

  // Don't render at all if nothing has started and nothing to show
  if (
    !loading &&
    !hasStructured &&
    !hasSections &&
    primaryText.length === 0 &&
    !hasStarted
  ) {
    return null;
  }

  const isForest = variant === "forest";
  // When forest variant, content wraps in <Ticket> (cream paper), so text uses ink colors
  const textColor = isForest
    ? "#18150e"
    : variant === "on-surface"
      ? "var(--surface-foreground, #18150e)"
      : "var(--foreground, #18150e)";
  const labelColor = isForest
    ? "rgba(197,165,90,0.65)"
    : "var(--muted-foreground, #7a7050)";
  const cursorColor = isForest ? "#9a7c22" : "var(--gold, #c5a55a)";

  const content = (
    <>
      {/* AR-01: 4-phase loading */}
      {loading && <AR01Loader phase={phaseIndex} onTicket={isForest} />}

      {/* AR-04: Locked */}
      {!loading && locked && (
        <LockedPreview
          previewText={primaryText}
          cost={unlockCost}
          onUnlock={onUnlock}
          unlockBusy={unlockBusy}
          onTicket={isForest}
        />
      )}

      {/* AR-05: LaSo section list */}
      {!loading && !locked && hasSections && (
        <LaSoSectionList
          sections={sectionList}
          onRetry={
            onRetry ? (id) => onRetry(id) : undefined
          }
          retryBusy={retryBusy}
        />
      )}

      {/* AR-03: Structured reading */}
      {!loading && !locked && !hasSections && hasStructured && (
        <SectionedCard
          sr={structuredReading!}
          onShare={onShare}
          onPin={onPin}
          isPinned={isPinned}
          pinBusy={pinBusy}
          onTicket={isForest}
        />
      )}

      {/* AR-02: Typed reveal / plain text */}
      {!loading && !locked && !hasSections && !hasStructured && (
        <>
          {revealActive ? (
            <p
              style={{
                fontFamily: "var(--serif, 'Lora', serif)",
                fontSize: 15,
                lineHeight: 1.68,
                color: textColor,
                margin: 0,
                position: "relative",
              }}
            >
              {displayed}
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 16,
                  marginLeft: 2,
                  verticalAlign: "middle",
                  background: cursorColor,
                  animation: "ar-blink 1s steps(1) infinite",
                }}
              />
            </p>
          ) : primaryText.length > 0 ? (
            <>
              <p
                style={{
                  fontFamily: "var(--serif, 'Lora', serif)",
                  fontSize: 15,
                  lineHeight: 1.68,
                  color: textColor,
                  margin: 0,
                }}
              >
                {primaryText}
              </p>
              {/* AR-06: Pin + Share for plain text */}
              {(onPin || onShare) && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px dashed rgba(122,112,80,0.3)",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  {onPin && (
                    <button
                      type="button"
                      disabled={pinBusy}
                      onClick={onPin}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: isPinned
                          ? "rgba(139,26,26,0.18)"
                          : "rgba(197,165,90,0.08)",
                        border: `1px solid ${isPinned ? "rgba(139,26,26,0.5)" : "rgba(197,165,90,0.3)"}`,
                        padding: "6px 11px",
                        cursor: pinBusy ? "default" : "pointer",
                        opacity: pinBusy ? 0.65 : 1,
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        color: isPinned ? "#c07070" : "rgba(197,165,90,0.85)",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span style={{ fontFamily: "var(--hanzi)", fontSize: 12, fontWeight: 700 }}>
                        留
                      </span>
                      <span>{isPinned ? "Bỏ ghim" : "Ghim"}</span>
                    </button>
                  )}
                  {onShare && (
                    <button
                      type="button"
                      onClick={onShare}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "rgba(197,165,90,0.08)",
                        border: "1px solid rgba(197,165,90,0.3)",
                        padding: "6px 11px",
                        cursor: "pointer",
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        color: "rgba(197,165,90,0.85)",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      Chia sẻ
                    </button>
                  )}
                </div>
              )}
            </>
          ) : hasStarted ? (
            <p
              style={{
                fontFamily: "var(--serif, 'Lora', serif)",
                fontSize: 14,
                color: labelColor,
                lineHeight: 1.55,
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {emptyLabel}
            </p>
          ) : null}
        </>
      )}

      {/* Retry button for non-section surfaces */}
      {!loading && !locked && !hasSections && onRetry && !hasStructured && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            disabled={retryBusy}
            onClick={() => onRetry()}
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: isForest ? "#9a7c22" : "rgba(197,165,90,0.7)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              background: "transparent",
              border: "none",
              cursor: retryBusy ? "default" : "pointer",
              padding: 0,
              textDecoration: "underline",
              textDecorationColor: "rgba(197,165,90,0.3)",
            }}
          >
            {retryBusy ? "Đang thử lại…" : "Thử lại luận giải"}
          </button>
        </div>
      )}
    </>
  );

  // Outer wrapper — forest variant wraps content in cream Ticket (per design b-ai-reading.jsx)
  return (
    <div
      style={{
        marginTop: 8,
        ...(variant === "on-card"
          ? {
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(154,124,34,0.2)",
              background: "rgba(154,124,34,0.04)",
              padding: "10px 12px",
            }
          : {}),
      }}
    >
      {/* Title label — rendered outside Ticket on the dark forest surface */}
      {showTitle ? (
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: labelColor,
            marginBottom: 8,
          }}
        >
          {title}
        </p>
      ) : null}

      {isForest ? (
        <Ticket holeColor="#1d3129" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 22px 18px" }}>{content}</div>
        </Ticket>
      ) : (
        content
      )}
    </div>
  );
}
