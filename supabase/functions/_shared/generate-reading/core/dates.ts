const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

export function todayIsoVietnam(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** ISO day for preflight — same key order as `buildDayLuanPromptContext` / bat-tu payloads. */
export function dayIsoFromDayDetailData(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const root = data as Record<string, unknown>;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  for (const obj of [nested, root]) {
    for (const key of ["date_iso", "date", "iso_date", "isoDate", "ngay"]) {
      const v = obj[key];
      if (typeof v !== "string") continue;
      const t = v.trim().slice(0, 10);
      if (ISO_DAY_RE.test(t)) return t;
    }
  }
  return null;
}
