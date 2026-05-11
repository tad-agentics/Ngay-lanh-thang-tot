/** Nhãn tháng Vận tháng: dương lịch + (tức âm lịch) từ payload convert-date. */

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

function pickLunarMonthNum(obj: Record<string, unknown>): number | null {
  for (const k of [
    "lunar_month",
    "lunarMonth",
    "month",
    "thang_am",
    "thang_am_lich",
    "thangAm",
  ]) {
    const v = obj[k];
    if (typeof v === "number" && v >= 1 && v <= 13) return Math.floor(v);
    if (typeof v === "string" && /^\d+$/.test(v)) {
      const n = Number.parseInt(v, 10);
      if (n >= 1 && n <= 13) return n;
    }
  }
  return null;
}

const YEAR_CAN_CHI_KEYS = [
  "year_can_chi",
  "yearCanChi",
  "can_chi_nam",
  "lunar_year_name",
  "nam_can_chi",
  "can_chi_year",
  "year_label",
  "year_name",
  "lunar_year_can_chi",
  "nam_am_lich",
] as const;

function pickYearCanChi(obj: Record<string, unknown>): string {
  return pickStr(obj, [...YEAR_CAN_CHI_KEYS]);
}

/** Tìm chuỗi có mẫu "tháng … năm …" ở bất kỳ chuỗi nào trong payload (tối đa vài cấp). */
function scanObjectsForLunarProse(obj: unknown, depth: number): string | null {
  if (depth < 0 || obj == null) return null;
  if (typeof obj === "string" && obj.length > 8) {
    const p = lunarTucFromProse(obj);
    return p;
  }
  const r = asRecord(obj);
  if (!r) return null;
  for (const v of Object.values(r)) {
    if (typeof v === "string" && v.length > 8) {
      const p = lunarTucFromProse(v);
      if (p) return p;
    } else if (v && typeof v === "object") {
      const p = scanObjectsForLunarProse(v, depth - 1);
      if (p) return p;
    }
  }
  return null;
}

/** Tháng âm dạng chữ → số (để thống nhất "Tháng 2"). */
const VI_THANG_AM: Record<string, number> = {
  giêng: 1,
  "tháng giêng": 1,
  hai: 2,
  ba: 3,
  tư: 4,
  bốn: 4,
  năm: 5,
  sáu: 6,
  bảy: 7,
  tám: 8,
  chín: 9,
  mười: 10,
  "mười một": 11,
  "mười hai": 12,
  chạp: 12,
};

function vietnameseLunarMonthWordToNum(w: string): number | null {
  const k = w
    .toLowerCase()
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");
  return VI_THANG_AM[k] ?? null;
}

/**
 * Trích "Tháng M Năm Can Chi" từ chuỗi kiểu "Ngày 1 tháng 2 năm Bính Ngọ", "tháng Hai năm Bính Ngọ".
 */
function lunarTucFromProse(prose: string): string | null {
  const m = /\btháng\s+(\d{1,2}|[A-Za-zÀ-ỹĨịĩ]+(?:\s+[A-Za-zÀ-ỹĨịĩ]+)?)\s+năm\s+([A-Za-zÀ-ỹĨịĩ]+(?:\s+[A-Za-zÀ-ỹĨịĩ]+)?)/iu.exec(
    prose,
  );
  if (!m) return null;
  const monthRaw = m[1]!.trim();
  const yearPart = m[2]!.trim();
  if (/^\d{1,2}$/.test(monthRaw)) {
    const mn = Number.parseInt(monthRaw, 10);
    if (mn >= 1 && mn <= 13) return `Tháng ${mn} Năm ${yearPart}`;
  }
  const n = vietnameseLunarMonthWordToNum(monthRaw);
  if (n != null) return `Tháng ${n} Năm ${yearPart}`;
  const titleMonth =
    monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1).toLowerCase();
  return `Tháng ${titleMonth} Năm ${yearPart}`;
}

/**
 * Đọc dòng "(tức …)" từ JSON `/v1/convert-date` (hình dạng tu-tru-api linh hoạt).
 */
export function parseConvertDateLunarTucLine(raw: unknown): string | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  const lunar = asRecord(nested.lunar);
  const month =
    (lunar ? pickLunarMonthNum(lunar) : null) ?? pickLunarMonthNum(nested);
  const yearName =
    pickYearCanChi(lunar ?? {}) || pickYearCanChi(nested);

  if (month != null && yearName) {
    return `Tháng ${month} Năm ${yearName}`;
  }

  const prose = pickStr(lunar ?? nested, [
    "lunar_date",
    "lunar_label",
    "am_lich",
    "lunar_text",
    "label_am",
    "display",
    "text",
    "label",
    "formatted",
    "full",
    "description",
  ]);
  if (!prose) {
    const proseNested = pickStr(nested, [
      "lunar_date",
      "lunar_label",
      "am_lich",
      "lunar_text",
      "label_am",
    ]);
    if (proseNested) {
      const fromProse = lunarTucFromProse(proseNested);
      if (fromProse) return fromProse;
    }
  } else {
    const fromProse = lunarTucFromProse(prose);
    if (fromProse) return fromProse;
  }

  const scanned = scanObjectsForLunarProse(nested, 4);
  if (scanned) return scanned;

  return null;
}

/** `YYYY-MM` (tháng dương) → "Tháng M Năm YYYY". */
export function solarYmToTitleLabel(ym: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) return null;
  const y = Number.parseInt(m[1]!, 10);
  const mo = Number.parseInt(m[2]!, 10);
  if (!y || !mo || mo < 1 || mo > 12) return null;
  return `Tháng ${mo} Năm ${y}`;
}

export function buildVanThangMonthHeading(
  solarLabel: string,
  lunarTuc: string | null | undefined,
): string {
  if (lunarTuc) return `${solarLabel} (tức ${lunarTuc})`;
  return solarLabel;
}

/**
 * Bỏ đoạn đầu trùng tháng/năm dương đã hiện ở tiêu đề (vd. API thêm "tháng 3 năm 2026.").
 * `ym` dạng `YYYY-MM`.
 */
export function stripRedundantSolarMonthPrefix(text: string, ym: string): string {
  const raw = text.trim();
  if (!raw) return raw;

  const parsed = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!parsed) return raw;
  const y = Number.parseInt(parsed[1]!, 10);
  const mo = Number.parseInt(parsed[2]!, 10);
  if (!y || !mo || mo < 1 || mo > 12) return raw;

  const monAlt = mo < 10 ? `(?:0?${mo})` : `${mo}`;

  const head = new RegExp(
    `^\\s*tháng\\s*${monAlt}\\s+năm\\s*${y}\\s*(?:\\([^)]*\\))?\\s*[.:–—\\-]?\\s*`,
    "iu",
  );

  let next = raw.replace(head, "").trim();
  if (next.length === 0) return raw;
  /* Lần 2: vài bản API lặp hai câu mở đầu giống nhau */
  next = next.replace(head, "").trim();
  return next.length === 0 ? raw : next;
}
