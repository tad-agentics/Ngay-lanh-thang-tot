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

export function readTodayAiReadingSession(
  userId: string,
  dayIso: string,
): string | null {
  try {
    const raw = sessionStorage.getItem(
      todayAiReadingSessionKey(userId, dayIso),
    );
    if (!raw) return null;
    const t = raw.trim();
    return t.length > 0 ? t : null;
  } catch {
    return null;
  }
}

export function writeTodayAiReadingSession(
  userId: string,
  dayIso: string,
  text: string,
): void {
  try {
    sessionStorage.setItem(
      todayAiReadingSessionKey(userId, dayIso),
      text.trim().slice(0, MAX_TODAY_READING_CACHE_CHARS),
    );
  } catch {
    /* quota / private mode */
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
