import { motion } from "motion/react";

import { Chip } from "~/components/Chip";
import { Kanji, Mono, Ticket } from "~/components/brand";

interface ShareCardCanvasProps {
  eventLabel: string;
  date: string;
  lunarDate: string;
  reasonShort: string;
  menh: string;
  grade?: "A" | "B" | "C";
  shareUrl?: string;
  onShare: () => void;
  onSaveImage: () => void;
}

/** Share phiếu — Direction B Ticket on forest (caller provides page chrome). */
export function ShareCardCanvas({
  eventLabel,
  date,
  lunarDate,
  reasonShort,
  menh,
  grade,
  shareUrl,
  onShare,
  onSaveImage,
}: ShareCardCanvasProps) {
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ position: "relative" }}
      >
        <Ticket holeColor="#1d3129">
          <div
            style={{
              padding: "20px 18px 22px",
              position: "relative",
              color: "var(--ink, #18150e)",
            }}
          >
            <Kanji
              ch="吉"
              size={120}
              drift
              style={{
                position: "absolute",
                right: -16,
                top: -8,
                color: "rgba(197,165,90,0.12)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <Mono style={{ color: "var(--gold-deep, #7d6219)", marginBottom: 6 }}>
                    Ngày lành tháng tốt
                  </Mono>
                  <h2
                    style={{
                      fontFamily: "var(--display-2)",
                      fontWeight: 800,
                      fontSize: 22,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      margin: 0,
                      textTransform: "uppercase",
                    }}
                  >
                    {eventLabel}
                  </h2>
                </div>
                {grade ? (
                  <Chip color="accent" variant="flat" size="sm" radius="sm">
                    Hạng {grade}
                  </Chip>
                ) : null}
              </div>

              <div
                style={{
                  borderTop: "1px dashed rgba(122,112,80,0.4)",
                  paddingTop: 12,
                  marginBottom: 12,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontWeight: 600,
                    fontSize: 22,
                    color: "var(--gold-deep, #7d6219)",
                    lineHeight: 1.25,
                    margin: 0,
                  }}
                >
                  {date}
                </p>
                {lunarDate ? (
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 12,
                      color: "var(--muted, #6a5f3f)",
                      margin: "6px 0 0",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {lunarDate}
                  </p>
                ) : null}
              </div>

              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2, #3a3a3a)",
                  margin: "0 0 14px",
                }}
              >
                {reasonShort}
              </p>

              {shareUrl ? (
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "var(--muted, #6a5f3f)",
                    wordBreak: "break-all",
                    margin: "0 0 12px",
                    lineHeight: 1.45,
                  }}
                >
                  {shareUrl}
                </p>
              ) : null}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "var(--muted, #6a5f3f)",
                  }}
                >
                  Mệnh {menh}
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "var(--muted, #6a5f3f)",
                  }}
                >
                  ngaylanhthangtot.vn
                </span>
              </div>
            </div>
          </div>
        </Ticket>
      </motion.div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={onShare}
          style={{
            flex: 1,
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "var(--gold, #c5a55a)",
            color: "var(--ink, #18150e)",
            border: "none",
            fontFamily: "var(--display-2)",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Chia sẻ
        </button>
        <button
          type="button"
          onClick={onSaveImage}
          style={{
            minHeight: 48,
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "transparent",
            border: "1px solid rgba(197,165,90,0.45)",
            color: "var(--cream, #ede7d3)",
            fontFamily: "var(--display-2)",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Lưu ảnh
        </button>
      </div>
    </div>
  );
}
