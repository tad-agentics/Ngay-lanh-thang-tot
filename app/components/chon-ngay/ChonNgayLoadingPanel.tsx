import { AnimatePresence, motion } from "motion/react";

interface ChonNgayLoadingPanelProps {
  dayCount: number;
  menh: string | null;
  resultCount: number;
  phase: 0 | 1 | 2;
}

const PHASE_TEXTS = (
  dayCount: number,
  menh: string | null,
  resultCount: number,
) => [
  `Đang lọc ${dayCount} ngày…`,
  menh
    ? `Đang so sánh với mệnh ${menh}…`
    : "Đang phân tích lịch vạn niên…",
  `Tìm thấy ${resultCount} ngày phù hợp`,
];

/** D1: phased loading copy (no spinner). */
export function ChonNgayLoadingPanel({
  dayCount,
  menh,
  resultCount,
  phase,
}: ChonNgayLoadingPanelProps) {
  const texts = PHASE_TEXTS(dayCount, menh, resultCount);

  return (
    <div className="text-center py-12">
      <div className="flex flex-col gap-3 items-center">
        {texts.map((text, i) => (
          <AnimatePresence key={i} mode="wait">
            {phase >= i ? (
              <motion.p
                key={`chon-ngay-loading-line-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: phase === i ? 1 : 0.35 }}
                className="text-[#6b6558] text-sm"
              >
                {phase === 2 && i === 2 ? (
                  <span className="text-success font-medium">{text}</span>
                ) : (
                  text
                )}
              </motion.p>
            ) : null}
          </AnimatePresence>
        ))}
      </div>
    </div>
  );
}
