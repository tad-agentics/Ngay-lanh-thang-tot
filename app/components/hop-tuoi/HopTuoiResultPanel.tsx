import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

import { AiReadingBlock } from "~/components/AiReadingBlock";
import { Chip } from "~/components/Chip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import type {
  HopTuoiCriterionRow,
  HopTuoiGradLabel,
  HopTuoiPanelView,
} from "~/lib/hop-tuoi-result";

function scoreColor(score: number): string {
  if (score >= 85) return "oklch(0.52 0.10 155)";
  if (score >= 70) return "oklch(0.53 0.11 80)";
  return "oklch(0.48 0.04 80)";
}

function gradChipColor(
  label: HopTuoiGradLabel,
): "success" | "warning" | "default" {
  if (label === "Rất hợp" || label === "Hợp") return "success";
  if (label === "Trung bình") return "warning";
  return "default";
}

function sentimentBadge(row: HopTuoiCriterionRow): {
  labelVi: string;
  className: string;
} {
  switch (row.sentiment) {
    case "positive":
      return {
        labelVi: "Tốt",
        className:
          "border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
      };
    case "negative":
      return {
        labelVi: "Cần lưu ý",
        className:
          "border-destructive/35 bg-destructive/10 text-destructive dark:text-red-300",
      };
    case "neutral":
      return {
        labelVi: "Trung tính",
        className:
          "border-amber-600/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
      };
    default:
      return {
        labelVi: "Chưa phân loại",
        className: "border-border bg-muted/40 text-muted-foreground",
      };
  }
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Trên ngưỡng này (hoặc nhiều đoạn) mới dùng thu gọn — mô tả 1–2 câu đọc thẳng luôn. */
const CRITERION_COLLAPSE_MIN_CHARS = 200;

function shouldCollapseCriterionDescription(text: string): boolean {
  const t = text.trim();
  if (t.length > CRITERION_COLLAPSE_MIN_CHARS) return true;
  if (/\n\s*\n/.test(t)) return true;
  const lines = t.split("\n").filter((l) => l.trim().length > 0);
  return lines.length > 2;
}

function HopTuoiCriterionCollapsibleDesc({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <CollapsibleTrigger
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left text-xs text-muted-foreground hover:text-foreground transition-colors rounded-sm py-1"
      >
        <span>{open ? "Thu gọn mô tả" : "Xem mô tả"}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 text-xs text-muted-foreground leading-relaxed data-[state=closed]:animate-none">
        {text}
      </CollapsibleContent>
    </Collapsible>
  );
}

function HopTuoiCriterionItem({
  row,
  index,
}: {
  row: HopTuoiCriterionRow;
  index: number;
}) {
  const { labelVi, className } = sentimentBadge(row);
  const desc = row.description?.trim() ?? "";
  const hasDesc = desc.length > 0;
  const useCollapse = hasDesc && shouldCollapseCriterionDescription(desc);

  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 * index, duration: 0.25 }}
      className="list-none border border-border/80 rounded-md bg-background/50 px-3 py-2.5"
    >
      <div className="flex flex-wrap items-start gap-2 gap-y-1.5">
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium border shrink-0 ${className}`}
          aria-label={`Mức tiêu chí: ${labelVi}`}
        >
          {labelVi}
        </span>
        <span className="text-sm text-foreground font-medium leading-snug min-w-0 flex-1">
          {row.name}
        </span>
      </div>
      {hasDesc && !useCollapse ? (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{desc}</p>
      ) : null}
      {hasDesc && useCollapse ? <HopTuoiCriterionCollapsibleDesc text={desc} /> : null}
    </motion.li>
  );
}

/** Vòng điểm v1 / v2 khi API có điểm 0–100. */
function ScoreRingBlock({
  score,
  gradLabel,
  chipLabel,
  scoreDisclaimer,
}: {
  score: number;
  gradLabel: HopTuoiGradLabel;
  chipLabel: string;
  /** Chỉ hiện khi v2 có điểm kèm theo — tránh nhầm với điểm tổng “mặc định”. */
  scoreDisclaimer?: boolean;
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [score]);

  const offset = animated ? CIRCUMFERENCE * (1 - score / 100) : CIRCUMFERENCE;
  const color = scoreColor(score);

  return (
    <>
      <div
        className="relative flex items-center justify-center"
        style={{ width: 120, height: 120 }}
      >
        <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={8}
          />
          <circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 800ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="leading-none"
            style={{
              fontFamily: "var(--font-ibm-mono)",
              fontSize: 32,
              fontWeight: 500,
              color,
            }}
          >
            {animated ? <CountUp end={score} duration={1.2} /> : 0}
          </span>
          <span className="text-muted-foreground text-xs mt-1">/ 100</span>
        </div>
      </div>
      {scoreDisclaimer ? (
        <p className="text-[10px] text-muted-foreground text-center max-w-[280px] leading-relaxed px-2">
          Điểm 0–100 do API gửi kèm phản hồi v2 (không phải mọi phản hồi v2 đều có).
        </p>
      ) : null}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="flex flex-col items-center gap-2"
      >
        <Chip color={gradChipColor(gradLabel)} size="md" radius="sm">
          {chipLabel}
        </Chip>
      </motion.div>
    </>
  );
}

/** Khối định tính v2 — không vòng /100 khi API không gửi điểm. */
function VerdictHeadlineBlock({
  verdict,
  verdictLevel,
  gradLabel,
}: {
  verdict: string | null;
  verdictLevel: number | null;
  gradLabel: HopTuoiGradLabel;
}) {
  /** Tránh lặp khi API gửi verdict trùng nhãn bậc (vd. cả hai đều "Cần lưu ý"). */
  const verdictNorm = verdict?.normalize("NFC").trim() ?? "";
  const gradNorm = gradLabel.normalize("NFC").trim();
  const showGradChip = !verdict || verdictNorm !== gradNorm;

  return (
    <div className="flex flex-col items-center gap-3 w-full px-1">
      {verdict ? (
        <p
          className="text-center text-base sm:text-lg font-medium text-foreground leading-snug"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          {verdict}
        </p>
      ) : null}
      {verdictLevel != null ? (
        <p
          className="text-center text-xs text-muted-foreground"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          Mức đánh giá: {verdictLevel}/4
        </p>
      ) : null}
      {showGradChip ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Chip color={gradChipColor(gradLabel)} size="md" radius="sm">
            {gradLabel}
          </Chip>
        </motion.div>
      ) : null}
    </div>
  );
}

function PersonMiniCard({
  title,
  card,
}: {
  title: string;
  card: NonNullable<HopTuoiPanelView["personCards"]["p1"]>;
}) {
  const show =
    card.menh !== "—" ||
    card.hanh ||
    card.nhatChu ||
    card.genderLabel ||
    card.birthDate;
  if (!show) return null;

  return (
    <div
      className="rounded-md border border-border/80 bg-muted/20 px-3 py-2.5 text-xs"
      style={{ borderRadius: "var(--radius-md)" }}
    >
      <p
        className="text-[10px] text-muted-foreground mb-1.5 tracking-wide"
        style={{ fontFamily: "var(--font-ibm-mono)" }}
      >
        {title}
      </p>
      <p className="text-sm font-medium text-foreground">
        Nạp Âm:{" "}
        <span className="text-accent">{card.menh === "—" ? "—" : card.menh}</span>
      </p>
      <div className="mt-1 space-y-0.5 text-muted-foreground leading-relaxed">
        {card.hanh ? <p>Hành: {card.hanh}</p> : null}
        {card.nhatChu ? <p>Nhật Chủ: {card.nhatChu}</p> : null}
        {card.genderLabel ? (
          <p>Giới tính: {card.genderLabel}</p>
        ) : title === "Người so sánh" ? (
          <p className="text-[11px] italic">
            Chưa khai báo đủ — một số luận giải (vd. Phu Thê) có thể trung
            tính.
          </p>
        ) : null}
        {card.birthDate ? (
          <p className="font-[family-name:var(--font-ibm-mono)] text-[11px]">
            {card.birthDate}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export type HopTuoiResultPanelProps = HopTuoiPanelView & {
  aiReadingLoading: boolean;
  aiReadingText: string | null;
};

export function HopTuoiResultPanel({
  aiReadingLoading,
  aiReadingText,
  apiVersion,
  score,
  showNumericScore,
  gradLabel,
  chipLabel,
  verdict,
  verdictLevel,
  criteriaRows,
  advice,
  relationshipLabel,
  personCards,
}: HopTuoiResultPanelProps) {
  /** `advice` từ API v2 thường generic / trùng Nạp Âm; LLM đã nhận full JSON — chỉ hiện khi không có Luận giải. */
  const showApiAdviceFallback =
    apiVersion === 2 &&
    Boolean(advice?.trim()) &&
    !aiReadingLoading &&
    !aiReadingText?.trim();

  const p1 = personCards.p1;
  const p2 = personCards.p2;
  const showPeople =
    (p1 &&
      (p1.menh !== "—" ||
        p1.hanh ||
        p1.nhatChu ||
        p1.genderLabel ||
        p1.birthDate)) ||
    (p2 &&
      (p2.menh !== "—" ||
        p2.hanh ||
        p2.nhatChu ||
        p2.genderLabel ||
        p2.birthDate));

  return (
    <div className="flex flex-col items-center gap-6">
      {relationshipLabel ? (
        <div className="w-full flex flex-col items-center gap-1.5">
          <Chip color="default" size="sm" radius="sm">
            {relationshipLabel}
          </Chip>
        </div>
      ) : null}

      {apiVersion === 1 && score != null ? (
        <ScoreRingBlock
          score={score}
          gradLabel={gradLabel}
          chipLabel={chipLabel}
        />
      ) : null}

      {apiVersion === 2 && showNumericScore && score != null ? (
        <ScoreRingBlock
          score={score}
          gradLabel={gradLabel}
          chipLabel={chipLabel}
          scoreDisclaimer
        />
      ) : null}

      {apiVersion === 2 && !showNumericScore ? (
        <VerdictHeadlineBlock
          verdict={verdict}
          verdictLevel={verdictLevel}
          gradLabel={gradLabel}
        />
      ) : null}

      {showPeople && (p1 || p2) ? (
        <div className="w-full grid gap-2 sm:grid-cols-2">
          {p1 ? <PersonMiniCard title="BẠN" card={p1} /> : null}
          {p2 ? <PersonMiniCard title="Người so sánh" card={p2} /> : null}
        </div>
      ) : null}

      {apiVersion === 2 && criteriaRows.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="w-full border border-border bg-card px-4 py-3"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <p
            className="text-muted-foreground text-[10px] mb-3 uppercase tracking-wide"
            style={{ fontFamily: "var(--font-ibm-mono)" }}
          >
            Chi tiết từng tiêu chí
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {criteriaRows.map((row, i) => (
              <HopTuoiCriterionItem key={`${i}-${row.name.slice(0, 32)}`} row={row} index={i} />
            ))}
          </ul>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="w-full"
      >
        <AiReadingBlock
          title="Luận giải"
          variant="on-card"
          loading={aiReadingLoading}
          text={aiReadingText}
        />
      </motion.div>

      {showApiAdviceFallback ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="w-full border border-border bg-card px-4 py-3"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <p
            className="text-muted-foreground text-[10px] mb-2 uppercase tracking-wide"
            style={{ fontFamily: "var(--font-ibm-mono)" }}
          >
            Gợi ý
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{advice}</p>
        </motion.div>
      ) : null}

    </div>
  );
}
