import type { CalendarDay } from "~/lib/api-types";
import type { ScoreMethodologyView } from "~/lib/score-methodology";
import { todayIsoInVn } from "~/lib/today-reading-cache";

export type LichThangBirthFingerprintInput = {
  birth_date?: string | null;
  birth_time?: number | null;
  gender?: number | null;
};

export type LichThangCacheEntry = {
  days: CalendarDay[];
  lunarMonthLabel: string | null;
  scoreMethodology?: ScoreMethodologyView | null;
  cachedAt: string;
};

const MAX_CACHED_MONTHS = 14;

function cacheKey(
  userId: string,
  monthKey: string,
  birthFingerprint: string,
): string {
  return `ngaytot_lich_thang:${userId}:${monthKey}:${birthFingerprint}`;
}

export function lichThangBirthFingerprint(body: LichThangBirthFingerprintInput): string {
  return `${body.birth_date ?? ""}|${body.birth_time ?? ""}|${body.gender ?? ""}`;
}

export function refreshCalendarTodayFlags(
  days: CalendarDay[],
  todayIso = todayIsoInVn(),
): CalendarDay[] {
  return days.map((d) => ({ ...d, isToday: d.isoDate === todayIso }));
}

function isCalendarDay(x: unknown): x is CalendarDay {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.isoDate === "string" &&
    (o.dayType === "hoang-dao" ||
      o.dayType === "hac-dao" ||
      o.dayType === "neutral") &&
    typeof o.isToday === "boolean" &&
    typeof o.lunarDay === "number" &&
    typeof o.lunarMonth === "number"
  );
}

function parseEntry(raw: string): LichThangCacheEntry | null {
  try {
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object" || Array.isArray(j)) return null;
    const o = j as Record<string, unknown>;
    if (!Array.isArray(o.days) || !o.days.every(isCalendarDay)) return null;
    const lunarMonthLabel =
      typeof o.lunarMonthLabel === "string" ? o.lunarMonthLabel : null;
    const scoreMethodology =
      o.scoreMethodology &&
      typeof o.scoreMethodology === "object" &&
      !Array.isArray(o.scoreMethodology)
        ? (o.scoreMethodology as ScoreMethodologyView)
        : null;
    const cachedAt =
      typeof o.cachedAt === "string" ? o.cachedAt : new Date(0).toISOString();
    return {
      days: refreshCalendarTodayFlags(o.days as CalendarDay[]),
      lunarMonthLabel,
      scoreMethodology,
      cachedAt,
    };
  } catch {
    return null;
  }
}

export function readLichThangCache(
  userId: string,
  monthKey: string,
  birthFingerprint: string,
): LichThangCacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId, monthKey, birthFingerprint));
    if (!raw) return null;
    return parseEntry(raw);
  } catch {
    return null;
  }
}

function trimOldMonthCaches(userId: string, birthFingerprint: string): void {
  const prefix = `ngaytot_lich_thang:${userId}:`;
  const suffix = `:${birthFingerprint}`;
  const entries: { key: string; cachedAt: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix) || !key.endsWith(suffix)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const parsed = parseEntry(raw);
    entries.push({
      key,
      cachedAt: parsed ? Date.parse(parsed.cachedAt) : 0,
    });
  }
  if (entries.length <= MAX_CACHED_MONTHS) return;
  entries.sort((a, b) => a.cachedAt - b.cachedAt);
  for (const e of entries.slice(0, entries.length - MAX_CACHED_MONTHS)) {
    localStorage.removeItem(e.key);
  }
}

export function clearLichThangCachesForUser(userId: string): void {
  try {
    const prefix = `ngaytot_lich_thang:${userId}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

export function writeLichThangCache(
  userId: string,
  monthKey: string,
  birthFingerprint: string,
  entry: Omit<LichThangCacheEntry, "cachedAt">,
): void {
  try {
    const payload: LichThangCacheEntry = {
      ...entry,
      days: refreshCalendarTodayFlags(entry.days),
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      cacheKey(userId, monthKey, birthFingerprint),
      JSON.stringify(payload),
    );
    trimOldMonthCaches(userId, birthFingerprint);
  } catch {
    /* quota / private mode */
  }
}
