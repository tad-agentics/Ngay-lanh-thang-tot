import type { ResultDay } from "~/lib/api-types";

export function isWeekendIso(iso: string): boolean {
  const dt = new Date(`${iso}T12:00:00`);
  const day = dt.getDay();
  return day === 0 || day === 6;
}

export function filterWeekendDays(days: ResultDay[]): ResultDay[] {
  return days.filter((d) => isWeekendIso(d.isoDate));
}
