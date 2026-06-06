import type { CalendarDay } from "~/lib/api-types";
import * as U from "~/lib/home-bat-tu-utils";

/** Build calendar days for `month`/`year`; merges engine month payload when present. */
export function buildCalendarDaysForMonth(
  month: number,
  year: number,
  lichThangPayload: unknown | null,
): CalendarDay[] {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const byIso = new Map<string, CalendarDay>();

  if (lichThangPayload != null) {
    for (const row of U.extractDayArray(lichThangPayload)) {
      const o = U.asRecord(row);
      if (!o) continue;
      const iso = U.pickIsoFromDayRow(o);
      if (!iso) continue;
      const dayType = U.inferDayType(o);
      const { lunarDay, lunarMonth } = U.pickLunarDayMonth(o);
      const score =
        U.pickNumber(o, ["score", "diem", "total_score", "totalScore"]) ??
        U.pickNumber(U.asRecord(o.scores) ?? {}, ["total", "value", "score"]);
      byIso.set(iso, {
        isoDate: iso,
        dayType,
        isToday: iso === todayIso,
        lunarDay,
        lunarMonth,
        score,
      });
    }
  }

  const out: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const existing = byIso.get(isoDate);
    if (existing) {
      out.push({ ...existing, isToday: isoDate === todayIso });
    } else {
      out.push({
        isoDate,
        dayType: "neutral",
        isToday: isoDate === todayIso,
        lunarDay: 0,
        lunarMonth: 0,
      });
    }
  }
  return out;
}

