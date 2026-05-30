import type { NgayHomNayHome } from "~/lib/home-bat-tu";

/** Cùng múi giờ với Edge `reading-unlock` / `generate-reading` (Asia/Ho_Chi_Minh). */
export function todayIsoInVn(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const MAX_TODAY_READING_CACHE_CHARS = 16_000;

export function todayAiReadingSessionKey(userId: string, dayIso: string): string {
  return `ngaytot_today_ai_reading:${userId}:${dayIso}`;
}

function todayAiReadingLocalKey(userId: string, dayIso: string): string {
  return `ngaytot_today_ai_reading_local:${userId}:${dayIso}`;
}

function inlineReadingSeenKey(userId: string, dayIso: string): string {
  return `ngaytot_inline_reading_seen:${userId}:${dayIso}`;
}

function readCachedReading(key: string): string | null {
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!raw) return null;
    const t = raw.trim();
    return t.length > 0 ? t : null;
  } catch {
    return null;
  }
}

function writeCachedReading(key: string, text: string): void {
  const value = text.trim().slice(0, MAX_TODAY_READING_CACHE_CHARS);
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

export function readTodayAiReadingSession(
  userId: string,
  dayIso: string,
): string | null {
  return readCachedReading(todayAiReadingSessionKey(userId, dayIso));
}

/** Persistent inline luận — localStorage + sessionStorage (survives tab refresh). */
export function readTodayAiReadingCache(
  userId: string,
  dayIso: string,
): string | null {
  return (
    readCachedReading(todayAiReadingLocalKey(userId, dayIso)) ??
    readTodayAiReadingSession(userId, dayIso)
  );
}

export function writeTodayAiReadingSession(
  userId: string,
  dayIso: string,
  text: string,
): void {
  const value = text.trim().slice(0, MAX_TODAY_READING_CACHE_CHARS);
  writeCachedReading(todayAiReadingSessionKey(userId, dayIso), value);
  writeCachedReading(todayAiReadingLocalKey(userId, dayIso), value);
}

export function hasSeenInlineReading(userId: string, dayIso: string): boolean {
  try {
    return localStorage.getItem(inlineReadingSeenKey(userId, dayIso)) === "1";
  } catch {
    return false;
  }
}

export function markInlineReadingSeen(userId: string, dayIso: string): void {
  try {
    localStorage.setItem(inlineReadingSeenKey(userId, dayIso), "1");
  } catch {
    /* ignore */
  }
}

function todayHomeSessionKey(userId: string, dayIso: string): string {
  return `ngaytot_today_home:${userId}:${dayIso}`;
}

function isNgayHomNayHomeShape(raw: unknown): raw is NgayHomNayHome {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const o = raw as Record<string, unknown>;
  const dt = o.dayType;
  if (dt !== "hoang-dao" && dt !== "hac-dao" && dt !== "neutral") {
    return false;
  }
  return (
    typeof o.solarDateVi === "string" &&
    typeof o.lunarLabel === "string" &&
    typeof o.hourRange === "string"
  );
}

export function readTodayHomeSession(
  userId: string,
  dayIso: string,
): NgayHomNayHome | null {
  try {
    const raw = sessionStorage.getItem(todayHomeSessionKey(userId, dayIso));
    if (!raw) return null;
    const j = JSON.parse(raw) as unknown;
    return isNgayHomNayHomeShape(j) ? j : null;
  } catch {
    return null;
  }
}

export function writeTodayHomeSession(
  userId: string,
  dayIso: string,
  home: NgayHomNayHome,
): void {
  try {
    sessionStorage.setItem(
      todayHomeSessionKey(userId, dayIso),
      JSON.stringify(home),
    );
  } catch {
    /* ignore */
  }
}
