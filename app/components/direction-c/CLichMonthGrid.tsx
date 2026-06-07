import type { CalendarDay } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { scoreDotColor, scoreFromDayType } from "~/lib/c-score";

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export type CLichMonthGridProps = {
  year: number;
  month: number;
  days: CalendarDay[];
  todayIso: string;
  selectedIso: string;
  onSelectDay: (iso: string) => void;
};

export function CLichMonthGrid({
  year,
  month,
  days,
  todayIso,
  selectedIso,
  onSelectDay,
}: CLichMonthGridProps) {
  const startDay = new Date(year, month - 1, 1).getDay();
  const mondayFirst = (startDay + 6) % 7;
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  type Cell = {
    d: number;
    otherMonth: boolean;
    score?: number;
    iso?: string;
    lunarDay?: number;
  };

  const cells: Cell[] = [];
  for (let i = prevMonthDays - mondayFirst + 1; i <= prevMonthDays; i++) {
    cells.push({ d: i, otherMonth: true });
  }
  for (const day of days) {
    const solar = Number(day.isoDate.slice(8, 10));
    cells.push({
      d: solar,
      otherMonth: false,
      score:
        day.score != null && Number.isFinite(day.score)
          ? day.score
          : scoreFromDayType(day.dayType),
      iso: day.isoDate,
      lunarDay: day.lunarDay > 0 ? day.lunarDay : undefined,
    });
  }
  let j = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ d: j++, otherMonth: true });
    if (cells.length >= 42) break;
  }

  return (
    <div
      role="grid"
      aria-label={`Lịch tháng ${month} năm ${year}`}
      style={{ marginTop: 22 }}
    >
      <div
        role="row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
        }}
      >
        {WEEKDAY_SHORT.map((d, i) => (
          <div
            key={d}
            role="columnheader"
            aria-label={d}
            style={{
              textAlign: "center",
              fontFamily: "var(--mono)",
              fontSize: 9.5,
              color: i === 6 ? CT.red : "var(--muted)",
              letterSpacing: "0.08em",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        role="row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
        }}
      >
        {cells.map((c, i) => {
          const isSelected = Boolean(c.iso && c.iso === selectedIso);
          const todayYear = Number(todayIso.slice(0, 4));
          const isToday =
            c.iso === todayIso ||
            (c.d === Number(todayIso.slice(8, 10)) &&
              !c.otherMonth &&
              year === todayYear &&
              month === Number(todayIso.slice(5, 7)));
          const lunarDay = c.otherMonth ? null : c.lunarDay ?? null;
          const clickable = Boolean(c.iso && !c.otherMonth);

          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              disabled={!clickable}
              aria-selected={isSelected}
              aria-current={isToday ? "date" : undefined}
              aria-label={
                c.iso
                  ? `Ngày ${c.d}${isSelected ? ", đang chọn" : ""}${isToday ? ", hôm nay" : ""}`
                  : undefined
              }
              onClick={() => {
                if (c.iso) onSelectDay(c.iso);
              }}
              className="border-none bg-transparent p-0"
              style={{
                aspectRatio: "1 / 1",
                padding: "4px 0 3px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: clickable ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  width: 29,
                  height: 29,
                  flexShrink: 0,
                  borderRadius: "50%",
                  background: isSelected ? CT.forest : "transparent",
                  boxShadow:
                    isToday && !isSelected
                      ? `inset 0 0 0 1.5px ${CT.forest}`
                      : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: isSelected || isToday ? 800 : 600,
                    fontSize: 16.5,
                    color: isSelected
                      ? CT.cream
                      : c.otherMonth
                        ? "rgba(154,124,34,0.3)"
                        : CT.ink,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {c.d}
                </span>
              </div>
              <div
                style={{
                  marginTop: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    lineHeight: 1,
                    fontFamily: "var(--serif)",
                    fontSize: 11.5,
                    color: c.otherMonth ? "transparent" : "rgba(24,21,14,0.42)",
                  }}
                >
                  {c.otherMonth ? "·" : lunarDay ?? "·"}
                </span>
                {!c.otherMonth && c.score != null ? (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      flexShrink: 0,
                      borderRadius: "50%",
                      background: scoreDotColor(c.score),
                    }}
                  />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CLichMonthScoreLegend() {
  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        fontFamily: "var(--serif)",
        fontSize: 11.5,
        color: CT.muted,
      }}
    >
      {(
        [
          ["Tốt", CT.greenMute],
          ["Khá", CT.gold],
          ["Bình", CT.muted],
          ["Tránh", CT.red],
        ] as const
      ).map(([l, c]) => (
        <span
          key={l}
          style={{ display: "flex", alignItems: "center", gap: 5 }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: c,
            }}
          />
          {l}
        </span>
      ))}
    </div>
  );
}
