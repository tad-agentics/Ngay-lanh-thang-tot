const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIsoVietnam(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function dayIsoFromDayDetailData(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  for (const key of ["date_iso", "date", "iso_date", "isoDate"]) {
    const v = d[key];
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (ISO_DAY_RE.test(t)) return t;
  }
  return null;
}
