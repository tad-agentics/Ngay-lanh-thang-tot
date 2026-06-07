import { todayIsoInVn } from "~/lib/today-reading-cache";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Canonical in-app path for a calendar day on `/lich`. */
export function lichDayPath(iso: string, todayIso = todayIsoInVn()): string {
  const t = iso.trim().slice(0, 10);
  if (!ISO_DAY.test(t)) return "/lich";
  if (t === todayIso) return "/lich";
  const ym = ymFromIso(t);
  const params = new URLSearchParams({
    ngay: t,
    year: String(ym.year),
    month: String(ym.month),
  });
  return `/lich?${params.toString()}`;
}

/** Open `/lich` scrolled to a month grid (does not change selected day). */
export function lichMonthPath(year: number, month: number): string {
  return `/lich?year=${year}&month=${month}`;
}

export function ymFromIso(iso: string): { year: number; month: number } {
  return {
    year: Number(iso.slice(0, 4)),
    month: Number(iso.slice(5, 7)),
  };
}

/** Write `year` / `month` (+ optional `ngay`) onto existing search params. */
export function applyLichCalendarParams(
  base: URLSearchParams,
  opts: { iso?: string; year: number; month: number; todayIso?: string },
): URLSearchParams {
  const today = opts.todayIso ?? todayIsoInVn();
  const next = new URLSearchParams(base);
  next.set("year", String(opts.year));
  next.set("month", String(opts.month));
  if (opts.iso) {
    if (opts.iso === today) {
      next.delete("ngay");
    } else {
      next.set("ngay", opts.iso);
    }
  }
  return next;
}

export function hasValidLichNgayParam(raw: string | null): boolean {
  if (!raw?.trim()) return false;
  return ISO_DAY.test(raw.trim().slice(0, 10));
}

/** Grid month: `ngay` wins when present; else `year`/`month` query; else selected day. */
export function resolveLichViewYm(
  selectedIso: string,
  yearRaw: string | null,
  monthRaw: string | null,
  hasNgayParam: boolean,
): { year: number; month: number } {
  if (hasNgayParam) return ymFromIso(selectedIso);
  const fromQuery = parseLichViewMonth(yearRaw, monthRaw);
  if (fromQuery) return fromQuery;
  return ymFromIso(selectedIso);
}

export function parseLichViewMonth(
  yearRaw: string | null,
  monthRaw: string | null,
): { year: number; month: number } | null {
  const year = yearRaw ? Number(yearRaw) : NaN;
  const month = monthRaw ? Number(monthRaw) : NaN;
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}
