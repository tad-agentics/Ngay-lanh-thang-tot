const MAX_FOLLOW_UPS_PER_DAY = 10;

function quotaKey(userId: string, dayIso: string): string {
  return `ngaytot_day_chat_quota:${userId}:${dayIso}`;
}

export function readDayLuanFollowUpCount(
  userId: string,
  dayIso: string,
): number {
  try {
    const raw = sessionStorage.getItem(quotaKey(userId, dayIso));
    if (!raw || !/^\d+$/.test(raw)) return 0;
    return Number.parseInt(raw, 10);
  } catch {
    return 0;
  }
}

export function incrementDayLuanFollowUpCount(
  userId: string,
  dayIso: string,
): number {
  const next = Math.min(
    MAX_FOLLOW_UPS_PER_DAY,
    readDayLuanFollowUpCount(userId, dayIso) + 1,
  );
  try {
    sessionStorage.setItem(quotaKey(userId, dayIso), String(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function dayLuanFollowUpRemaining(
  userId: string,
  dayIso: string,
): number {
  return Math.max(0, MAX_FOLLOW_UPS_PER_DAY - readDayLuanFollowUpCount(userId, dayIso));
}

export const DAY_LUAN_MAX_FOLLOW_UPS = MAX_FOLLOW_UPS_PER_DAY;
