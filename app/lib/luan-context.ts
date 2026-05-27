/** Parse `/luan-ai/:context` route param (e.g. `day-2026-05-26`, `bazi-year`, `tieu-van-2026`). */

export type LuanDayContext = {
  kind: "day";
  iso: string;
};

export type LuanBaziContext = {
  kind: "bazi-year";
};

export type LuanTieuVanContext = {
  kind: "tieu-van";
  year: number;
};

export type LuanContext =
  | LuanDayContext
  | LuanBaziContext
  | LuanTieuVanContext
  | { kind: "invalid" };

const DAY_PREFIX = "day-";
const TIEU_VAN_PREFIX = "tieu-van-";

export function parseLuanContext(raw: string | undefined): LuanContext {
  if (!raw) return { kind: "invalid" };

  if (raw === "bazi-year") {
    return { kind: "bazi-year" };
  }

  if (raw.startsWith(TIEU_VAN_PREFIX)) {
    const year = Number.parseInt(raw.slice(TIEU_VAN_PREFIX.length), 10);
    if (Number.isFinite(year) && year >= 1900 && year <= 2100) {
      return { kind: "tieu-van", year };
    }
    return { kind: "invalid" };
  }

  if (!raw.startsWith(DAY_PREFIX)) {
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

export function luanTieuVanContextToParam(year: number): string {
  return `${TIEU_VAN_PREFIX}${year}`;
}
