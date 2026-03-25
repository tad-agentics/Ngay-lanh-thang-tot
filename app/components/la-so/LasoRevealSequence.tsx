import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

import { GrainOverlay } from "~/components/GrainOverlay";

interface LasoRevealSequenceProps {
  nhatChu: string;
  nhatChuHan: string;
  hanh: string;
  menh: string;
  dungThan: string;
  kyThan: string;
  daiVan: string;
  onComplete: () => void;
  onCancel?: () => void;
}

/** D2 lá số reveal — timing per emotional-design §6 / Make spec (~2.5s). */
export function LasoRevealSequence({
  nhatChu,
  nhatChuHan,
  hanh,
  menh,
  dungThan,
  kyThan,
  daiVan,
  onComplete,
  onCancel,
}: LasoRevealSequenceProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 1100),
      setTimeout(() => setStep(3), 1700),
      setTimeout(() => setStep(4), 2100),
      setTimeout(() => setStep(5), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center z-50 px-8">
      <GrainOverlay />

      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 p-2 text-surface-foreground/40 hover:text-surface-foreground/80 transition-colors"
          aria-label="Hủy"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      ) : null}

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={
          step >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }
        }
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-6"
      >
        <div
          className="text-accent mb-2 leading-none"
          style={{
            fontFamily: "var(--font-noto)",
            fontSize: 88,
            fontWeight: 700,
          }}
        >
          {nhatChuHan}
        </div>
        <div
          className="text-surface-foreground/60 text-sm tracking-widest uppercase"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          Nhật Chủ · {nhatChu} {hanh}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={step >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4"
      >
        <div
          className="text-surface-foreground text-sm font-medium mb-1"
          style={{ fontFamily: "var(--font-lora)" }}
        >
          Mệnh: {menh}
        </div>
        <div
          className="text-accent/80 text-xs"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          Dụng Thần: {dungThan}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={step >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-4"
      >
        <div
          className="text-surface-foreground/50 text-xs"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          Kỵ Thần: {kyThan}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={step >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div
          className="text-surface-foreground/50 text-xs"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          Đại Vận: {daiVan}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={step >= 5 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          type="button"
          onClick={onComplete}
          className="bg-accent text-accent-foreground px-8 py-3 text-sm font-medium"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          Hoàn tất
        </button>
      </motion.div>
    </div>
  );
}
