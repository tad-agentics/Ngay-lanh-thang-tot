/** Parse `/luan-ai/:context` route param (e.g. `day-2026-05-26`). */

export type LuanDayContext = {
  kind: "day";
  iso: string;
};

export type LuanContext = LuanDayContext | { kind: "invalid" };

const DAY_PREFIX = "day-";

export function parseLuanContext(raw: string | undefined): LuanContext {
  if (!raw?.startsWith(DAY_PREFIX)) {
    return { kind: "invalid" };
  }
  const iso = raw.slice(DAY_PREFIX.length);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { kind: "invalid" };
  }
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return { kind: "invalid" };
  }
  return { kind: "day", iso };
}

export function luanContextToParam(iso: string): string {
  return `${DAY_PREFIX}${iso}`;
}
