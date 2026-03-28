/**
 * Hiển thị "giờ Hoàng đạo" kiểu đọc được: "7–9 giờ sáng · 13–15 giờ chiều"
 * thay vì "Tý 23:00-01:00; ...".
 */

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Nhãn theo giờ bắt đầu khoảng (dương lịch 24h). */
function periodLabel(startHour: number): string {
  if (startHour >= 5 && startHour < 12) return "sáng";
  if (startHour >= 12 && startHour < 13) return "trưa";
  if (startHour >= 13 && startHour < 18) return "chiều";
  if (startHour >= 18 && startHour < 22) return "tối";
  return "đêm";
}

function fmtHourMinute(h: number, m: number): string {
  if (m === 0) return String(h);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function formatOneRange(
  startH: number,
  startM: number,
  endH: number,
  endM: number,
): string {
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  const overnight = endMin <= startMin && !(startH === endH && startM === endM);

  if (overnight) {
    return `${fmtHourMinute(startH, startM)} - ${fmtHourMinute(endH, endM)} giờ đêm`;
  }

  const period = periodLabel(startH);
  return `${fmtHourMinute(startH, startM)} - ${fmtHourMinute(endH, endM)} giờ ${period}`;
}

const RANGE_RE = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/;
const SIMPLE_H_RE = /(\d{1,2})\s*h\s*[–-]\s*(\d{1,2})\s*h/i;

/** Một khoảng giờ kiểu FigmaMake: `7–9h`, `23–1h` (phẩy ngăn cách các slot). */
function formatOneRangeCompact(
  startH: number,
  startM: number,
  endH: number,
  endM: number,
): string {
  const left =
    startM === 0 ? String(startH) : `${startH}:${String(startM).padStart(2, "0")}`;
  const right =
    endM === 0 ? String(endH) : `${endH}:${String(endM).padStart(2, "0")}`;
  return `${left}–${right}h`;
}

function parseSegmentToCompactFigma(segment: string): string | null {
  const s = segment.trim();
  if (!s) return null;

  const m = RANGE_RE.exec(s);
  if (m) {
    const sh = Number.parseInt(m[1]!, 10);
    const sm = Number.parseInt(m[2]!, 10);
    const eh = Number.parseInt(m[3]!, 10);
    const em = Number.parseInt(m[4]!, 10);
    if (
      [sh, sm, eh, em].every((n) => Number.isFinite(n)) &&
      sm >= 0 &&
      sm < 60 &&
      em >= 0 &&
      em < 60 &&
      sh >= 0 &&
      sh < 24 &&
      eh >= 0 &&
      eh < 24
    ) {
      return formatOneRangeCompact(sh, sm, eh, em);
    }
  }

  const hOnly = SIMPLE_H_RE.exec(s);
  if (hOnly) {
    const a = Number.parseInt(hOnly[1]!, 10);
    const b = Number.parseInt(hOnly[2]!, 10);
    if (Number.isFinite(a) && Number.isFinite(b) && a >= 0 && a < 24 && b >= 0 && b < 24) {
      return formatOneRangeCompact(a, 0, b, 0);
    }
  }

  return null;
}

function parseSegmentToDisplay(segment: string): string | null {
  const s = segment.trim();
  if (!s) return null;

  const m = RANGE_RE.exec(s);
  if (m) {
    const sh = Number.parseInt(m[1]!, 10);
    const sm = Number.parseInt(m[2]!, 10);
    const eh = Number.parseInt(m[3]!, 10);
    const em = Number.parseInt(m[4]!, 10);
    if (
      [sh, sm, eh, em].every((n) => Number.isFinite(n)) &&
      sm >= 0 &&
      sm < 60 &&
      em >= 0 &&
      em < 60 &&
      sh >= 0 &&
      sh < 24 &&
      eh >= 0 &&
      eh < 24
    ) {
      return formatOneRange(sh, sm, eh, em);
    }
  }

  const hOnly = SIMPLE_H_RE.exec(s);
  if (hOnly) {
    const a = Number.parseInt(hOnly[1]!, 10);
    const b = Number.parseInt(hOnly[2]!, 10);
    if (Number.isFinite(a) && Number.isFinite(b) && a >= 0 && a < 24 && b >= 0 && b < 24) {
      return formatOneRange(a, 0, b, 0);
    }
  }

  return null;
}

/** Chuỗi kiểu "Tý 23:00-01:00; Dần 07:00-09:00", "HH:MM-HH:MM, HH:MM-HH:MM", hoặc "9–11h". */
export function formatHourRangeStringDisplayVi(text: string): string | null {
  const raw = text.trim();
  if (!raw || raw === "—") return null;

  const parts = raw
    .split(/\s*;\s*/)
    .flatMap((chunk) => chunk.split(/\s*,\s*/))
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const hit = parseSegmentToDisplay(p);
    if (hit) out.push(hit);
  }

  if (out.length === 0) return null;
  return out.join(" · ");
}

/** Mảng `{ chi_name?, range | gio | time }` từ tu-tru-api. */
export function formatGioTotArrayDisplayVi(raw: unknown): string | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: string[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const range = pickStr(o, ["range", "gio", "time", "label_gio"]);
    if (!range) continue;
    const hit = parseSegmentToDisplay(range);
    if (hit) out.push(hit);
  }
  return out.length ? out.join(" · ") : null;
}

/** Cùng nguồn mảng slot nhưng hiển thị ngắn theo mock chi tiết ngày: `7–9h, 13–15h`. */
export function formatGioTotArrayCompactVi(raw: unknown): string | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: string[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const range = pickStr(o, ["range", "gio", "time", "label_gio"]);
    if (!range) continue;
    const hit = parseSegmentToCompactFigma(range);
    if (hit) out.push(hit);
  }
  return out.length ? out.join(", ") : null;
}

export function formatHourRangeStringCompactVi(text: string): string | null {
  const raw = text.trim();
  if (!raw || raw === "—") return null;
  const parts = raw.split(/\s*;\s*/);
  const out: string[] = [];
  for (const p of parts) {
    const hit = parseSegmentToCompactFigma(p);
    if (hit) out.push(hit);
  }
  return out.length ? out.join(", ") : null;
}

export function formatHourRangeForDisplayVi(
  textFallback: string,
  slots?: unknown,
): string {
  if (Array.isArray(slots) && slots.length > 0) {
    const fromArr = formatGioTotArrayDisplayVi(slots);
    if (fromArr) return fromArr;
  }
  const trimmed = textFallback.trim();
  if (!trimmed || trimmed === "—") return "—";
  const parsed = formatHourRangeStringDisplayVi(trimmed);
  return parsed ?? trimmed;
}

/** Giờ Hoàng/Hắc trên màn chi tiết (FigmaMake): `a–bh, c–dh`. */
export function formatHourRangeForDayDetailFigmaVi(
  textFallback: string,
  slots?: unknown,
): string {
  if (Array.isArray(slots) && slots.length > 0) {
    const fromArr = formatGioTotArrayCompactVi(slots);
    if (fromArr) return fromArr;
  }
  const trimmed = textFallback.trim();
  if (!trimmed || trimmed === "—") return "—";
  const parsed = formatHourRangeStringCompactVi(trimmed);
  return parsed ?? trimmed;
}
