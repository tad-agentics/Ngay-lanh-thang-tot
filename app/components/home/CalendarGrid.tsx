import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "~/components/ui/utils";
import type { CalendarDay } from "~/lib/api-types";

interface CalendarGridProps {
  month: number;
  year: number;
  days: CalendarDay[];
  onDayTap: (isoDate: string) => void;
  onMonthChange: (direction: "prev" | "next") => void;
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "",
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

export function CalendarGrid({
  month,
  year,
  days,
  onDayTap,
  onMonthChange,
}: CalendarGridProps) {
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  return (
    <div className="bg-card border border-border px-3 py-3" style={{ borderRadius: "var(--radius-lg)" }}>
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => onMonthChange("prev")}
          className="text-muted-foreground p-1 transition-colors active:text-foreground"
          style={{
            minWidth: 32,
            minHeight: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Tháng trước"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <h3
          className="text-foreground"
          style={{
            fontFamily: "var(--font-lora)",
            fontWeight: 600,
            fontSize: "var(--text-base)",
          }}
        >
          {MONTH_NAMES[month]} năm {year}
        </h3>
        <button
          type="button"
          onClick={() => onMonthChange("next")}
          className="text-muted-foreground p-1 transition-colors active:text-foreground"
          style={{
            minWidth: 32,
            minHeight: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Tháng sau"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-muted-foreground py-1" style={{ fontSize: 10 }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const d = new Date(day.isoDate).getDate();
          return (
            <button
              type="button"
              key={day.isoDate}
              onClick={() => onDayTap(day.isoDate)}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 transition-colors active:opacity-70",
                day.dayType === "hoang-dao" && "text-success",
                day.dayType === "hac-dao" && "text-danger",
                day.dayType === "neutral" && "text-foreground",
              )}
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <span
                className={cn(
                  "flex items-center justify-center text-xs font-medium",
                  day.isToday && "ring-1 ring-accent text-accent rounded-full",
                  day.dayType === "hoang-dao" && "bg-success/10",
                  day.dayType === "hac-dao" && "bg-danger/10",
                )}
                style={{ width: 26, height: 26, borderRadius: "50%" }}
              >
                {d}
              </span>
              {day.lunarDay > 0 ? (
                <span
                  className="text-[8px] mt-0.5 opacity-60"
                  style={{ fontFamily: "var(--font-ibm-mono)" }}
                >
                  {day.lunarDay}
                </span>
              ) : (
                <span className="text-[8px] mt-0.5 opacity-30" aria-hidden>
                  ·
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success inline-block" />
          <span className="text-muted-foreground" style={{ fontSize: 10 }}>
            Hoàng Đạo
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger inline-block" />
          <span className="text-muted-foreground" style={{ fontSize: 10 }}>
            Hắc Đạo
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-border inline-block" />
          <span className="text-muted-foreground" style={{ fontSize: 10 }}>
            Bình thường
          </span>
        </div>
      </div>
    </div>
  );
}
