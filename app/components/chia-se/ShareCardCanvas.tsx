import { motion } from "motion/react";
import { Share2, Download } from "lucide-react";

import { Chip } from "~/components/Chip";
import { GrainOverlay } from "~/components/GrainOverlay";

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

/** D4: spring scale-in + shadow on card. */
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
        className="relative overflow-hidden bg-surface text-surface-foreground p-5 shadow-xl"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <GrainOverlay />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p
                className="text-accent text-xs mb-1 tracking-widest uppercase"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                Ngày Lành Tháng Tốt
              </p>
              <h2
                className="text-surface-foreground"
                style={{
                  fontFamily: "var(--font-lora)",
                  fontWeight: 700,
                  fontSize: "var(--text-lg)",
                  lineHeight: 1.3,
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

          <div className="border-t border-surface-foreground/10 pt-3 mb-3">
            <p
              className="text-accent"
              style={{
                fontFamily: "var(--font-lora)",
                fontWeight: 600,
                fontSize: "var(--text-xl)",
                lineHeight: 1.3,
              }}
            >
              {date}
            </p>
            <p
              className="text-surface-foreground/60 text-xs mt-0.5"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {lunarDate}
            </p>
          </div>

          <p className="text-surface-foreground/80 text-sm leading-relaxed mb-4">
            {reasonShort}
          </p>

          {shareUrl ? (
            <p
              className="text-surface-foreground/50 text-[11px] break-all mb-3"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {shareUrl}
            </p>
          ) : null}

          <div className="flex items-center justify-between">
            <span
              className="text-surface-foreground/40 text-xs"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              Mệnh {menh}
            </span>
            <span
              className="text-surface-foreground/40 text-xs"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              ngaylanhthangtot.vn
            </span>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 text-sm font-medium"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <Share2 size={16} strokeWidth={1.5} />
          Chia sẻ
        </button>
        <button
          type="button"
          onClick={onSaveImage}
          className="flex items-center justify-center gap-2 border border-border text-foreground px-4 py-3 text-sm font-medium"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <Download size={16} strokeWidth={1.5} />
          Lưu ảnh
        </button>
      </div>
    </div>
  );
}
