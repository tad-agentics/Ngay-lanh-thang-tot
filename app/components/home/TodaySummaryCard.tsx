import { AiReadingBlock } from "~/components/AiReadingBlock";
import { Chip } from "~/components/Chip";
import { GrainOverlay } from "~/components/GrainOverlay";
import type { DayType } from "~/lib/api-types";

interface TodaySummaryCardProps {
  dayType: DayType;
  lunarDate: string;
  solarDate: string;
  isLoading?: boolean;
  aiReading?: string | null;
  aiReadingLoading?: boolean;
}

export function TodaySummaryCard({
  dayType,
  lunarDate,
  solarDate,
  isLoading,
  aiReading = null,
  aiReadingLoading = false,
}: TodaySummaryCardProps) {
  if (isLoading) {
    return (
      <div
        className="relative overflow-hidden px-4 py-3 bg-surface"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <GrainOverlay />
        <div className="relative">
          <div className="h-4 w-24 bg-surface-foreground/10 rounded mb-2 animate-pulse" />
          <div className="h-6 w-36 bg-surface-foreground/10 rounded mb-3 animate-pulse" />
          <div className="h-3 w-28 bg-surface-foreground/10 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const dayTypeLabel =
    dayType === "hoang-dao"
      ? "Hoàng Đạo"
      : dayType === "hac-dao"
        ? "Hắc Đạo"
        : "Bình thường";
  const chipColor =
    dayType === "hoang-dao"
      ? "success"
      : dayType === "hac-dao"
        ? "danger"
        : "default";

  return (
    <div
      className="relative overflow-hidden px-4 py-3 bg-surface text-surface-foreground"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <GrainOverlay />
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-surface-foreground/60 text-xs uppercase tracking-wider"
            style={{ fontFamily: "var(--font-ibm-mono)" }}
          >
            Hôm nay
          </span>
          <Chip color={chipColor} variant="flat" size="sm" radius="sm">
            {dayTypeLabel}
          </Chip>
        </div>

        <h2
          className="text-surface-foreground mb-1"
          style={{
            fontFamily: "var(--font-lora)",
            fontWeight: 600,
            fontSize: "var(--text-xl)",
            lineHeight: 1.3,
          }}
        >
          {solarDate}
        </h2>

        <p
          className="text-surface-foreground/60 text-xs"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          {lunarDate}
        </p>

        <AiReadingBlock
          title="Luận giải"
          variant="on-surface"
          loading={aiReadingLoading}
          text={aiReading}
        />
      </div>
    </div>
  );
}
