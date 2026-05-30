import type { LaSoJson } from "~/lib/api-types";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  gioSinhToBatTuBirthTime,
} from "~/lib/bat-tu-birth";
import { normalizeLaSoPayload } from "~/lib/la-so-normalize";

/** True when `profiles.la_so` already has a persisted payload (matches Edge `bat-tu`). */
export function profileHasStoredLaso(laSo: unknown): boolean {
  if (laSo == null || typeof laSo !== "object" || Array.isArray(laSo)) {
    return false;
  }
  return Object.keys(laSo as Record<string, unknown>).length > 0;
}

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
  return "—";
}

/** If `fieldKeys` map to an object (tu-tru-api style), read string from `nestedKeys` inside it. */
function pickStrOrFromNestedObject(
  obj: Record<string, unknown>,
  fieldKeys: string[],
  nestedKeys: string[],
): string {
  for (const k of fieldKeys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    const nested = asRecord(v);
    if (nested) {
      const inner = pickStr(nested, nestedKeys);
      if (inner !== "—") return inner;
    }
  }
  return "—";
}

function numOrStrToInt(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return Math.trunc(x);
  if (typeof x === "string" && x.trim()) {
    const n = Number.parseInt(x.trim(), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Khoảng tuổi một đại vận — ưu tiên tuổi mụ / âm lịch, rồi start/end hoặc age_range.
 */
function pickDaiVanYearsFromObject(o: Record<string, unknown>): string {
  return pickDaiVanCurrentYearsFromObject(o);
}

/**
 * Khoảng tuổi **đại vận hiện tại** — ưu tiên tuổi mụ / âm lịch hơn `age_range` (chu kỳ dương).
 * GET `/v1/la-so` thường tách `dai_van_current` hoặc `age_range_muc` khỏi `dai_van_list[].years`.
 */
function pickDaiVanCurrentYearsFromObject(o: Record<string, unknown>): string {
  const mucStart = numOrStrToInt(
    o.tuoi_muc_tu ??
      o.tuoi_muc_from ??
      o.muc_age_from ??
      o.age_muc_from ??
      o.ageMucFrom,
  );
  const mucEnd = numOrStrToInt(
    o.tuoi_muc_den ??
      o.tuoi_muc_to ??
      o.muc_age_to ??
      o.age_muc_to ??
      o.ageMucTo,
  );
  if (mucStart != null && mucEnd != null && mucStart <= mucEnd) {
    return `${mucStart}-${mucEnd}`;
  }
  const mucRange = pickStr(o, [
    "age_range_muc",
    "tuoi_muc_range",
    "age_range_lunar",
    "age_range_vn",
  ]);
  if (mucRange !== "—") return mucRange;

  const start = numOrStrToInt(
    o.start_age ??
      o.startAge ??
      o.age_from ??
      o.ageFrom ??
      o.tuoi_tu ??
      o.tuoiTu,
  );
  const end = numOrStrToInt(
    o.end_age ??
      o.endAge ??
      o.age_to ??
      o.ageTo ??
      o.tuoi_den ??
      o.tuoiDen,
  );
  if (start != null && end != null && start <= end) {
    return `${start}-${end}`;
  }
  return pickStr(o, ["age_range", "ageRange", "years", "range", "nam"]);
}

function mergeDaiVanCurrentRecords(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const labelBase = pickStr(base, ["display", "label", "name", "ten", "pillar"]);
  const labelOver = pickStr(overlay, ["display", "label", "name", "ten", "pillar"]);
  if (
    labelBase !== "—" &&
    labelOver !== "—" &&
    labelBase.trim() !== labelOver.trim()
  ) {
    return base;
  }
  return { ...base, ...overlay };
}

/** Gộp `dai_van_current` (GET la-so) vào `dai_van.current` khi API tách hai field. */
function mergeDaiVanParentCurrent(
  parentObj: Record<string, unknown> | null,
  flatCurrent: Record<string, unknown>,
): Record<string, unknown> {
  const hasFlat =
    pickStr(flatCurrent, ["display", "label", "name", "ten", "pillar"]) !==
      "—" || pickDaiVanCurrentYearsFromObject(flatCurrent) !== "—";
  if (!hasFlat) return parentObj;
  if (!parentObj) return { current: flatCurrent };
  const cur = asRecord(parentObj.current);
  if (!cur) return { ...parentObj, current: flatCurrent };
  return { ...parentObj, current: mergeDaiVanCurrentRecords(cur, flatCurrent) };
}

function formatDaiVanField(daiVanRaw: unknown): string {
  if (typeof daiVanRaw === "string" && daiVanRaw.trim()) return daiVanRaw.trim();
  const o = asRecord(daiVanRaw);
  if (!o) return "—";
  const cur = asRecord(o.current);
  if (cur) {
    const display = pickStr(cur, ["display", "label", "name", "ten"]);
    const range = pickDaiVanCurrentYearsFromObject(cur);
    if (display !== "—" && range !== "—") return `${display} (${range})`;
    if (display !== "—") return display;
  }
  const displayFlat = pickStr(o, ["display", "label", "name", "ten"]);
  const rangeFlat = pickDaiVanYearsFromObject(o);
  if (displayFlat !== "—" && rangeFlat !== "—") return `${displayFlat} (${rangeFlat})`;
  if (displayFlat !== "—") return displayFlat;
  return pickStr(o, ["display", "label", "summary"]);
}

/** Chuẩn hóa khoảng tuổi để so khớp API (gạch ngang thống nhất). */
function normalizeAgeRangeKey(s: string): string {
  return s.replace(/[–—]/g, "-").replace(/\s/g, "").trim();
}

/** Gom ngữ cảnh đại vận: danh sách vận và/hoặc object `dai_van` có `current`/`cycles` từ root, data, result. */
function getDaiVanContext(root: Record<string, unknown>): {
  listRaw: unknown[] | null;
  parentObj: Record<string, unknown> | null;
} {
  const layers = [root, asRecord(root.data), asRecord(root.result)].filter(
    (x): x is Record<string, unknown> => x != null,
  );
  let listRaw: unknown[] | null = null;
  let parentObj: Record<string, unknown> | null = null;
  let flatCurrent: Record<string, unknown> | null = null;
  for (const layer of layers) {
    const lr = layer.dai_van_list ?? layer.daiVanList;
    if (Array.isArray(lr) && lr.length > 0 && !listRaw) listRaw = lr;
    const po = asRecord(layer.dai_van) ?? asRecord(layer.daiVan);
    if (po && (po.current != null || Array.isArray(po.cycles)) && !parentObj) {
      parentObj = po;
    }
    if (!flatCurrent) {
      flatCurrent =
        asRecord(layer.dai_van_current) ??
        asRecord(layer.daiVanCurrent) ??
        asRecord(layer.current_dai_van);
    }
  }
  if (flatCurrent) {
    parentObj = mergeDaiVanParentCurrent(parentObj, flatCurrent);
  }
  return { listRaw, parentObj };
}

function applyCurrentToDaiVanRows(
  rows: { label: string; years: string; isActive: boolean }[],
  parentObj: Record<string, unknown> | null,
): { label: string; years: string; isActive: boolean }[] {
  const current = parentObj ? asRecord(parentObj.current) : null;
  const curLabel = current ? pickStr(current, ["display", "label", "name", "pillar"]) : "—";
  const curYears =
    current != null ? pickDaiVanCurrentYearsFromObject(current) : "—";
  const curYearsKey = curYears !== "—" ? normalizeAgeRangeKey(curYears) : "";

  if (curLabel === "—" && !curYearsKey) return rows;

  return rows.map((row) => {
    const yearsKey = row.years !== "—" ? normalizeAgeRangeKey(row.years) : "";
    const labelMatch =
      curLabel !== "—" &&
      row.label !== "—" &&
      row.label.trim() === curLabel.trim();
    const rangeMatch =
      curYearsKey.length > 0 && yearsKey.length > 0 && yearsKey === curYearsKey;
    return {
      ...row,
      isActive: row.isActive || labelMatch || rangeMatch,
    };
  });
}

/** Khi `dai_van.current` có nhãn không nằm trong `dai_van_list` (cache cũ), chèn hàng hiện tại lên đầu. */
function injectCurrentDaiVanIfMissingFromList(
  rows: { label: string; years: string; isActive: boolean }[],
  parentObj: Record<string, unknown> | null,
): { label: string; years: string; isActive: boolean }[] {
  const current = parentObj ? asRecord(parentObj.current) : null;
  if (!current || rows.length === 0) return rows;
  const curLabel = pickStr(current, ["display", "label", "name", "pillar"]);
  const curYears = pickDaiVanCurrentYearsFromObject(current);
  if (curLabel === "—") return rows;
  const inList = rows.some(
    (r) => r.label !== "—" && r.label.trim() === curLabel.trim(),
  );
  if (inList) return rows;
  return [
    {
      label: curLabel,
      years: curYears !== "—" ? curYears : "—",
      isActive: true,
    },
    ...rows.map((r) => ({ ...r, isActive: false })),
  ];
}

/** Khi `dai_van.current` có khoảng tuổi chi tiết hơn `dai_van_list`, hiển thị theo `current`. */
function preferCurrentYearsOnActiveRow(
  rows: { label: string; years: string; isActive: boolean }[],
  parentObj: Record<string, unknown> | null,
): { label: string; years: string; isActive: boolean }[] {
  const current = parentObj ? asRecord(parentObj.current) : null;
  if (!current) return rows;
  const curLabel = pickStr(current, ["display", "label", "name", "pillar"]);
  const curYears = pickDaiVanCurrentYearsFromObject(current);
  if (curLabel === "—" || curYears === "—") return rows;
  return rows.map((row) => {
    if (
      !row.isActive ||
      row.label === "—" ||
      row.label.trim() !== curLabel.trim()
    ) {
      return row;
    }
    return { ...row, years: curYears };
  });
}

function pickStrArr(obj: Record<string, unknown>, keys: string[]): string[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      return v as string[];
    }
  }
  return [];
}

const NGU_HANH_FIELD_KEYS = [
  "ngu_hanh",
  "nguHanh",
  "five_elements",
  "fiveElements",
  "nguHinh",
  "element_balance",
  "elementBalance",
  "phan_tram_ngu_hanh",
] as const;

function stripViCombining(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Map nhãn API (latin hoặc có dấu) → khóa cố định cho UI. */
function canonNguHanhKey(raw: string): string {
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (["kim", "moc", "thuy", "hoa", "tho"].includes(lower)) return lower;
  const a = stripViCombining(t);
  if (a === "kim" || a === "metal") return "kim";
  if (a === "moc" || a === "wood") return "moc";
  if (a === "thuy" || a === "water") return "thuy";
  if (a === "hoa" || a === "fire") return "hoa";
  if (a === "tho" || a === "earth") return "tho";
  return "";
}

function parseNguHanhNumber(nv: unknown): number | null {
  if (typeof nv === "number" && Number.isFinite(nv)) return nv;
  if (typeof nv === "string") {
    const n = Number.parseFloat(nv.replace(/%/g, "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractNguHanhFromLayer(
  layer: Record<string, unknown>,
): Record<string, number> | null {
  for (const field of NGU_HANH_FIELD_KEYS) {
    const v = layer[field];
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const out: Record<string, number> = {};
    for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
      const canon = canonNguHanhKey(nk);
      if (!canon) continue;
      const num = parseNguHanhNumber(nv);
      if (num != null) out[canon] = num;
    }
    if (Object.keys(out).length > 0) return out;
  }
  return null;
}

/**
 * Trọng số ngũ hành từ engine (vd. tu-tru-api `_raw.element_counts`: Kim/Mộc/…).
 * Chuẩn hóa thành %: 100 * v / sum(v) — không giả định đã là phần trăm.
 */
function extractNguHanhFromElementCounts(
  counts: unknown,
): Record<string, number> | null {
  if (counts == null || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const agg: Record<string, number> = {};
  for (const [nk, nv] of Object.entries(counts as Record<string, unknown>)) {
    const canon = canonNguHanhKey(nk);
    if (!canon) continue;
    const num =
      typeof nv === "number" && Number.isFinite(nv)
        ? nv
        : parseNguHanhNumber(nv);
    if (num == null || !Number.isFinite(num) || num < 0) continue;
    agg[canon] = (agg[canon] ?? 0) + num;
  }
  const keys = Object.keys(agg);
  if (keys.length === 0) return null;
  const sum = keys.reduce((s, k) => s + agg[k]!, 0);
  if (sum <= 0) return null;
  const out: Record<string, number> = {};
  for (const k of keys) {
    out[k] = (agg[k]! / sum) * 100;
  }
  return out;
}

/** Luôn trả đủ 5 cột; thiếu từ API → 0. */
function padFiveElements(hit: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {};
  for (const k of ["kim", "moc", "thuy", "hoa", "tho"] as const) {
    const v = hit[k];
    base[k] = typeof v === "number" && Number.isFinite(v) ? v : 0;
  }
  return base;
}

const NGU_HANH_PLACEHOLDER: Record<string, number> = {
  kim: 20,
  moc: 20,
  thuy: 20,
  hoa: 20,
  tho: 20,
};

/**
 * Đọc phân bổ ngũ hành (%) từ JSON lá số.
 * Ưu tiên `element_counts` (thường trong `_raw` từ GET la-so): trọng số → % theo tổng.
 * Sau đó các trường `ngu_hanh` / `five_elements` đã là %.
 * Nếu không có dữ liệu → placeholder đều 20% (chỉ để không trống UI).
 */
function pickNguHanh(root: Record<string, unknown>): Record<string, number> {
  const layers: Record<string, unknown>[] = [root];
  for (const k of ["data", "result", "tu_tru", "tu_tru_detail"] as const) {
    const n = asRecord(root[k]);
    if (n) layers.push(n);
  }

  const seen = new Set<Record<string, unknown>>();
  const all: Record<string, unknown>[] = [];
  const push = (x: Record<string, unknown> | null) => {
    if (!x || seen.has(x)) return;
    seen.add(x);
    all.push(x);
  };
  for (const layer of layers) {
    push(layer);
    push(asRecord(layer._raw));
    for (const ik of ["data", "result"] as const) {
      push(asRecord(layer[ik]));
    }
  }

  for (const layer of all) {
    const raw = asRecord(layer._raw);
    const fromCounts =
      extractNguHanhFromElementCounts(layer.element_counts) ??
      extractNguHanhFromElementCounts(
        (layer as { elementCounts?: unknown }).elementCounts,
      ) ??
      extractNguHanhFromElementCounts(raw?.element_counts) ??
      extractNguHanhFromElementCounts(
        raw ? (raw as { elementCounts?: unknown }).elementCounts : undefined,
      );
    if (fromCounts) return padFiveElements(fromCounts);
    const hit = extractNguHanhFromLayer(layer);
    if (hit) return padFiveElements(hit);
  }
  return { ...NGU_HANH_PLACEHOLDER };
}

function padTru(a: string[], n: number): string[] {
  const x = [...a];
  while (x.length < n) x.push("—");
  return x.slice(0, n);
}

export function profileHasLaso(laSo: unknown): boolean {
  if (laSo == null || typeof laSo !== "object" || Array.isArray(laSo)) {
    return false;
  }
  return Object.keys(laSo as Record<string, unknown>).length > 0;
}

/** D2 reveal props from stored/API lá số JSON (flexible keys). */
export function laSoJsonToRevealProps(raw: unknown): {
  nhatChu: string;
  nhatChuHan: string;
  hanh: string;
  menh: string;
  dungThan: string;
  kyThan: string;
  daiVan: string;
} | null {
  const normalized = normalizeLaSoPayload(raw);
  const root = asRecord(normalized);
  if (!root) return null;
  const nested = root;

  const pillars = asRecord(nested.pillars);
  const dayPillar = pillars ? asRecord(pillars.day) : null;
  const dayCan = dayPillar ? asRecord(dayPillar.can) : null;
  const dayChi = dayPillar ? asRecord(dayPillar.chi) : null;

  const ncObj =
    asRecord(nested.nhat_chu) ?? asRecord(nested.nhatChu) ?? null;
  let nhatChu = pickStrOrFromNestedObject(nested, ["nhat_chu", "nhatChu"], [
    "can_name",
    "canName",
    "stem",
    "can",
    "name",
    "label",
  ]);
  if (nhatChu === "—" && dayCan) {
    nhatChu = pickStr(dayCan, ["name", "can_name", "label"]);
  }

  let nhatChuHan = pickStr(ncObj ?? nested, [
    "nhat_chu_han",
    "nhatChuHan",
    "chi_name",
    "chiName",
    "can_han",
    "han_char",
  ]);
  if (nhatChuHan === "—" && ncObj) {
    nhatChuHan = pickStr(ncObj, ["chi_name", "chi_han", "han"]);
  }
  // API không trả chữ Hán; hiển thị Địa Chi ngày làm glyph lớn (UX gần với tứ trụ).
  if (nhatChuHan === "—" && dayChi) {
    nhatChuHan = pickStr(dayChi, ["name", "label"]);
  }

  let hanh = "—";
  if (ncObj) {
    hanh = pickStr(ncObj, ["hanh", "element", "ngu_hanh"]);
  }
  if (hanh === "—") {
    hanh = pickStr(nested, ["hanh", "element", "ngu_hanh_ngay"]);
  }
  if (hanh === "—" && dayCan) {
    hanh = pickStr(dayCan, ["hanh", "element"]);
  }

  let menh = pickStrOrFromNestedObject(nested, ["menh", "menh_chu"], [
    "nap_am_name",
    "napAmName",
    "name",
    "label",
    "ten",
  ]);
  if (menh === "—") {
    const y = pillars ? asRecord(pillars.year) : null;
    const nap = y ? asRecord(y.nap_am) : null;
    if (nap) menh = pickStr(nap, ["name", "nap_am_name", "label"]);
  }

  const dungThan = pickStrOrFromNestedObject(
    nested,
    ["dung_than", "dungThan", "dung_than_ban"],
    ["element", "name", "label", "ten"],
  );

  const kyThan = pickStrOrFromNestedObject(
    nested,
    ["ky_than", "kyThan", "ky_than_ban"],
    ["element", "name", "label", "ten"],
  );

  let daiVan = formatDaiVanField(
    nested.dai_van ??
      nested.daiVan ??
      nested.dai_van_current ??
      nested.daiVanCurrent,
  );
  if (daiVan === "—") {
    daiVan = pickStr(nested, ["dai_van", "daiVan", "dai_van_hien_tai"]);
  }

  return {
    nhatChu,
    nhatChuHan,
    hanh,
    menh,
    dungThan,
    kyThan,
    daiVan,
  };
}

/** Nap âm tagline for building-calendar quote (screen 10). */
export function extractMenhTagline(raw: unknown): string | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.tu_tru) ??
    root;
  const props = laSoJsonToRevealProps(raw);
  const menh = props?.menh && props.menh !== "—" ? props.menh : null;

  const pillars = asRecord(nested.pillars);
  const year = pillars ? asRecord(pillars.year) : null;
  const nap = year ? asRecord(year.nap_am) : null;
  const moTa = nap
    ? pickStr(nap, ["mo_ta", "description", "tagline", "summary"])
    : "—";
  if (moTa !== "—") {
    return menh ? `${menh} — ${moTa}` : moTa;
  }
  if (menh) return `${menh} — lá số của bạn đã sẵn sàng.`;
  return null;
}

const TU_TRU_PILLAR_KEYS = ["year", "month", "day", "hour"] as const;

function pillarLabelFromRecord(p: Record<string, unknown> | null): string {
  if (!p) return "···";
  const can = asRecord(p.can);
  const chi = asRecord(p.chi);
  const c = can ? pickStr(can, ["name", "can_name", "label"]) : "—";
  const ch = chi ? pickStr(chi, ["name", "chi_name", "label"]) : "—";
  if (c !== "—" && ch !== "—") return `${c} ${ch}`.trim();
  const flat = pickStr(p, ["label", "name", "ganzhi", "display"]);
  return flat !== "—" ? flat : "···";
}

/** Hour pillar preview for onboarding canh picker (screen 09). */
export function extractHourPillarPreview(raw: unknown): {
  label: string;
  hanh: string;
} | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.tu_tru) ??
    root;
  const pillars = asRecord(nested.pillars);
  const hour = pillars ? asRecord(pillars.hour) : null;
  const label = pillarLabelFromRecord(hour);
  if (label === "···" || label === "—") return null;

  const can = hour ? asRecord(hour.can) : null;
  const chi = hour ? asRecord(hour.chi) : null;
  let hanh = can
    ? pickStr(can, ["hanh", "element", "ngu_hanh", "nguHanh"])
    : "—";
  if (hanh === "—" && chi) {
    hanh = pickStr(chi, ["hanh", "element", "ngu_hanh", "nguHanh"]);
  }
  if (hanh === "—" && hour) {
    hanh = pickStr(hour, ["hanh", "element", "ngu_hanh"]);
  }
  return { label, hanh: hanh !== "—" ? hanh : "—" };
}

/** Four pillars for onboarding reveal (Niên → Thời). */
export function extractTuTruPillarLabels(raw: unknown): string[] {
  const root = asRecord(raw);
  if (!root) return ["···", "···", "···", "···"];
  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.tu_tru) ??
    root;
  const pillars = asRecord(nested.pillars);
  return TU_TRU_PILLAR_KEYS.map((k) =>
    pillarLabelFromRecord(pillars ? asRecord(pillars[k]) : null),
  );
}

export interface LaSoChiTietView {
  thienCan: string[];
  diaChi: string[];
  thanSat: string[];
  daiVanList: { label: string; years: string; isActive: boolean }[];
  nguHanh: Record<string, number>;
}

export function laSoJsonToChiTiet(j: LaSoJson | null | undefined): LaSoChiTietView {
  const normalized = normalizeLaSoPayload(j);
  const root = asRecord(normalized) ?? {};
  let thienCan = pickStrArr(root, ["thien_can", "thienCan", "can_list"]);
  let diaChi = pickStrArr(root, ["dia_chi", "diaChi", "chi_list"]);
  if (thienCan.length < 4) {
    const tu = asRecord(root.tu_tru) ?? asRecord(root.tu_tru_detail);
    if (tu) {
      thienCan = pickStrArr(tu, ["thien_can", "thienCan"]);
      diaChi = pickStrArr(tu, ["dia_chi", "diaChi"]);
    }
  }
  if (thienCan.length < 4) {
    const pillars = asRecord(root.pillars);
    if (pillars) {
      /** UI: cột Giờ → Ngày → Tháng → Năm (trái sang phải) */
      const order = ["hour", "day", "month", "year"] as const;
      const cans: string[] = [];
      const chis: string[] = [];
      for (const key of order) {
        const p = asRecord(pillars[key]);
        const can = p ? asRecord(p.can) : null;
        const chi = p ? asRecord(p.chi) : null;
        const cn = can ? pickStr(can, ["name", "label"]) : "—";
        const ch = chi ? pickStr(chi, ["name", "label"]) : "—";
        if (cn !== "—") cans.push(cn);
        if (ch !== "—") chis.push(ch);
      }
      if (cans.length) thienCan = cans;
      if (chis.length) diaChi = chis;
    }
  }
  thienCan = padTru(thienCan, 4);
  diaChi = padTru(diaChi, 4);

  let thanSat = pickStrArr(root, ["than_sat", "thanSat", "cat_than"]);
  if (!thanSat.length) {
    const ts = root.cat_than ?? root.than_sat_list;
    if (Array.isArray(ts)) {
      thanSat = ts
        .map((x) => (typeof x === "string" ? x : (x as { name?: string }).name))
        .filter((x): x is string => typeof x === "string" && x.length > 0);
    }
  }
  if (!thanSat.length) {
    const thap = asRecord(root.thap_than) ?? asRecord(root.thapThan);
    if (thap) {
      const seen = new Set<string>();
      const keys = ["dominant", "year", "month", "day", "hour"] as const;
      for (const k of keys) {
        const o = asRecord(thap[k]);
        if (!o) continue;
        const n = pickStr(o, ["name", "label"]);
        if (n !== "—" && !seen.has(n)) {
          seen.add(n);
          thanSat.push(n);
        }
      }
    }
  }
  if (!thanSat.length) thanSat = ["—"];

  const { listRaw: dvRaw, parentObj: dvParent } = getDaiVanContext(root);
  let daiVanList: { label: string; years: string; isActive: boolean }[] = [];
  if (Array.isArray(dvRaw)) {
    daiVanList = dvRaw.map((item) => {
      const o = asRecord(item) ?? {};
      return {
        label: pickStr(o, [
          "display",
          "label",
          "can_chi",
          "canChi",
          "ten",
          "name",
          "pillar",
        ]),
        years: pickDaiVanYearsFromObject(o),
        isActive:
          Boolean(o.active) ||
          Boolean(o.isActive) ||
          Boolean(o.is_current) ||
          o.current === true,
      };
    });
    daiVanList = applyCurrentToDaiVanRows(daiVanList, dvParent);
    daiVanList = preferCurrentYearsOnActiveRow(daiVanList, dvParent);
    daiVanList = injectCurrentDaiVanIfMissingFromList(daiVanList, dvParent);
    if (!daiVanList.some((x) => x.isActive) && daiVanList.length === 1) {
      daiVanList = [{ ...daiVanList[0], isActive: true }];
    }
  }
  if (!daiVanList.length) {
    const dvObj = dvParent;
    const cycles = dvObj ? dvObj.cycles : undefined;
    const current = dvObj ? asRecord(dvObj.current) : null;
    const curLabel = current ? pickStr(current, ["display", "label"]) : "—";
    const curYears =
      current != null ? pickDaiVanCurrentYearsFromObject(current) : "—";
    if (dvObj && Array.isArray(cycles)) {
      daiVanList = cycles.map((item) => {
        const o = asRecord(item) ?? {};
        const label = pickStr(o, ["display", "label", "name"]);
        const years = pickDaiVanYearsFromObject(o);
        const isActive =
          (curLabel !== "—" &&
            label !== "—" &&
            label.trim() === curLabel.trim()) ||
          (curYears !== "—" &&
            years !== "—" &&
            normalizeAgeRangeKey(years) === normalizeAgeRangeKey(curYears));
        return { label, years, isActive };
      });
      daiVanList = preferCurrentYearsOnActiveRow(daiVanList, dvObj);
    }
    if (!daiVanList.length && (curLabel !== "—" || curYears !== "—")) {
      daiVanList = [
        {
          label: curLabel !== "—" ? curLabel : "Đại Vận",
          years: curYears !== "—" ? curYears : "—",
          isActive: true,
        },
      ];
    }
  }
  if (!daiVanList.length) {
    const layers = [root, asRecord(root.data), asRecord(root.result)].filter(
      (x): x is Record<string, unknown> => x != null,
    );
    let dv = "—";
    for (const layer of layers) {
      dv = pickStr(layer, ["dai_van", "daiVan"]);
      if (dv !== "—") break;
      const po = asRecord(layer.dai_van) ?? asRecord(layer.daiVan);
      if (po) {
        const formatted = formatDaiVanField(po);
        if (formatted !== "—") {
          dv = formatted;
          break;
        }
      }
      const dvf =
        asRecord(layer.dai_van_current) ?? asRecord(layer.daiVanCurrent);
      if (dvf) {
        const formatted = formatDaiVanField(dvf);
        if (formatted !== "—") {
          dv = formatted;
          break;
        }
      }
    }
    daiVanList = [{ label: dv === "—" ? "Đại Vận" : dv, years: "—", isActive: true }];
  }

  const nguHanh = pickNguHanh(root);

  return { thienCan, diaChi, thanSat, daiVanList, nguHanh };
}

function isPlainElementCounts(
  v: unknown,
): v is Record<string, unknown> {
  return (
    v != null && typeof v === "object" && !Array.isArray(v)
  );
}

function pickElementCountsForEnrichment(
  layer: Record<string, unknown>,
): Record<string, unknown> | null {
  const raw = asRecord(layer._raw);
  const candidates: unknown[] = [
    layer.element_counts,
    (layer as { elementCounts?: unknown }).elementCounts,
    raw?.element_counts,
    raw ? (raw as { elementCounts?: unknown }).elementCounts : undefined,
  ];
  for (const c of candidates) {
    if (isPlainElementCounts(c)) return c as Record<string, unknown>;
  }
  return null;
}

function tryLayerElementCountsEnrichment(
  layer: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!layer) return null;
  const counts = pickElementCountsForEnrichment(layer);
  if (!counts) return null;
  return { _raw: { element_counts: counts } };
}

/**
 * Gói nhỏ `_raw.element_counts` (hoặc `element_counts`) từ phản hồi GET /v1/la-so
 * để ghép vào `profile.la_so` khi hiển thị chi tiết — tránh chỉ có tứ trụ từ POST tu-tru.
 */
/** Các lớp envelope hay gặp từ GET /v1/la-so hoặc payload đã lột. */
const LA_SO_ENRICH_NEST_KEYS = [
  "data",
  "result",
  "payload",
  "la_so",
  "chart",
  "detail",
] as const;

/** Trường GET /v1/la-so cần ghép vào `profile.la_so` (onboarding chỉ có tu-tru nhẹ). */
const LA_SO_ENRICHMENT_FIELDS = [
  "dai_van",
  "daiVan",
  "dai_van_current",
  "daiVanCurrent",
  "current_dai_van",
  "dai_van_list",
  "daiVanList",
  "pillars",
  "nhat_chu",
  "nhatChu",
  "dung_than",
  "dungThan",
  "ky_than",
  "kyThan",
  "hi_than",
  "hiThan",
  "element_counts",
  "elementCounts",
  "personality_traits",
  "personalityTraits",
] as const;

function laSoLayerFromUpstream(upstream: unknown): Record<string, unknown> | null {
  const normalized = normalizeLaSoPayload(upstream);
  return asRecord(normalized);
}

function pickLaSoEnrichmentFields(
  layer: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of LA_SO_ENRICHMENT_FIELDS) {
    if (layer[k] != null) out[k] = layer[k];
  }
  return out;
}

function tryNestedElementCountsEnrichment(
  r: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!r) return null;
  const direct = tryLayerElementCountsEnrichment(r);
  if (direct) return direct;
  for (const k of LA_SO_ENRICH_NEST_KEYS) {
    const hit = tryLayerElementCountsEnrichment(asRecord(r[k]));
    if (hit) return hit;
  }
  return null;
}

export function extractLaSoChiTietEnrichment(
  upstream: unknown,
): Record<string, unknown> | null {
  if (!upstream || typeof upstream !== "object" || Array.isArray(upstream)) {
    return null;
  }
  const root = upstream as Record<string, unknown>;
  const layer = laSoLayerFromUpstream(upstream);
  const out: Record<string, unknown> = layer
    ? pickLaSoEnrichmentFields(layer)
    : {};

  if (layer) {
    for (const nestKey of LA_SO_ENRICH_NEST_KEYS) {
      const inner = asRecord(layer[nestKey]);
      if (!inner) continue;
      for (const [k, v] of Object.entries(pickLaSoEnrichmentFields(inner))) {
        if (out[k] == null) out[k] = v;
      }
    }
    const counts = tryLayerElementCountsEnrichment(layer);
    if (counts?._raw) {
      const raw = asRecord(out._raw) ?? {};
      out._raw = { ...raw, ...(counts._raw as Record<string, unknown>) };
    }
  }

  if (Object.keys(out).length > 0) return out;

  return (
    tryNestedElementCountsEnrichment(root) ??
    tryNestedElementCountsEnrichment(asRecord(root.data)) ??
    tryNestedElementCountsEnrichment(asRecord(root.result))
  );
}

export function mergeLaSoJsonForChiTietDisplay(
  stored: LaSoJson | null | undefined,
  enrichment: Record<string, unknown> | null | undefined,
): LaSoJson | null | undefined {
  if (!stored) return stored;
  if (!enrichment || Object.keys(enrichment).length === 0) return stored;
  const s = stored as Record<string, unknown>;
  const e = enrichment;
  const out: Record<string, unknown> = { ...s, ...e };
  const sRaw = asRecord(s._raw);
  const eRaw = asRecord(e._raw);
  if (sRaw && eRaw) {
    out._raw = { ...sRaw, ...eRaw };
  }
  return out as LaSoJson;
}

/** Nap âm mô tả ngắn — italic quote dưới headline màn 17 (`CLaSoFull`). */
export function extractMenhMoTa(raw: unknown): string | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.tu_tru) ??
    root;
  const pillars = asRecord(nested.pillars);
  const year = pillars ? asRecord(pillars.year) : null;
  const nap = year ? asRecord(year.nap_am) : null;
  const moTa = nap
    ? pickStr(nap, ["mo_ta", "description", "tagline", "summary"])
    : "—";
  return moTa !== "—" ? moTa : null;
}

function hanhFromPillarRecord(p: Record<string, unknown> | null): string {
  if (!p) return "—";
  const can = asRecord(p.can);
  const chi = asRecord(p.chi);
  let hanh = can
    ? pickStr(can, ["hanh", "element", "ngu_hanh", "nguHanh"])
    : "—";
  if (hanh === "—" && chi) {
    hanh = pickStr(chi, ["hanh", "element", "ngu_hanh", "nguHanh"]);
  }
  if (hanh === "—") {
    hanh = pickStr(p, ["hanh", "element", "ngu_hanh"]);
  }
  return hanh !== "—" ? hanh : "—";
}

function ageFromNgaySinh(ngaySinh: string | null | undefined): number | null {
  if (!ngaySinh) return null;
  const ymd = ngaySinh.includes("T")
    ? ngaySinh.slice(0, 10)
    : ngaySinh.slice(0, 10);
  const parts = ymd.split("-").map((x) => Number.parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts as [number, number, number];
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 150 ? age : null;
}

function gioSinhSublineVi(gioSinh: string | null | undefined): string | null {
  const code = gioSinhToBatTuBirthTime(gioSinh ?? null);
  if (code === undefined) return null;
  const opt = BAT_TU_BIRTH_TIME_OPTIONS.find((o) => o.value === code);
  if (!opt) return null;
  const m = /(\d+)h\s*[–—-]\s*(\d+)h/i.exec(opt.label);
  if (m) {
    const start = Number(m[1]);
    const end = Number(m[2]) + 1;
    const period =
      end <= 12 || start < 6 ? "sáng" : start < 18 ? "chiều" : "tối";
    return `${start}–${end}h ${period}`;
  }
  return opt.label.replace(/^Giờ\s+/, "");
}

export type LaSoFullPillarRow = {
  label: "Niên" | "Nguyệt" | "Nhật" | "Thời";
  canChi: string;
  hanh: string;
  subline: string;
  isDayMaster: boolean;
};

/** Bốn trụ cho màn `/toi/la-so` — khớp maket `CLaSoFull`. */
export function buildLaSoFullPillarRows(
  raw: unknown,
  profile?: { ngay_sinh?: string | null; gio_sinh?: string | null } | null,
): LaSoFullPillarRow[] {
  const normalized = normalizeLaSoPayload(raw);
  const root = asRecord(normalized);
  if (!root) return [];
  const nested = root;
  const pillars = asRecord(nested.pillars);
  const detail = laSoJsonToChiTiet(raw as LaSoJson);
  const keys = ["year", "month", "day", "hour"] as const;
  const labels = ["Niên", "Nguyệt", "Nhật", "Thời"] as const;

  return keys.map((key, i) => {
    const p = pillars ? asRecord(pillars[key]) : null;
    const arrIdx = 3 - i;
    let canChi = pillarLabelFromRecord(p);
    if (canChi === "···" || canChi === "—") {
      const can = detail.thienCan[arrIdx] ?? "—";
      const chi = detail.diaChi[arrIdx] ?? "—";
      canChi = can !== "—" && chi !== "—" ? `${can} ${chi}` : can;
    }

    let subline = "—";
    if (key === "year") {
      const age = ageFromNgaySinh(profile?.ngay_sinh);
      const canOnly = canChi.split(" ")[0] ?? "";
      if (age != null && canOnly && canOnly !== "—") {
        subline = `${age} tuổi · ${canOnly}`;
      } else if (age != null) {
        subline = `${age} tuổi`;
      } else {
        subline = "niên trụ";
      }
    } else if (key === "month") {
      subline = "tháng sinh";
    } else if (key === "day") {
      subline = "NHẬT CHỦ";
    } else {
      subline = gioSinhSublineVi(profile?.gio_sinh) ?? "giờ sinh";
    }

    return {
      label: labels[i]!,
      canChi,
      hanh: hanhFromPillarRecord(p),
      subline,
      isDayMaster: key === "day",
    };
  });
}

const ELEMENT_COLOR_TOKENS: Record<string, readonly string[]> = {
  Kim: ["trắng", "xám", "đen"],
  Mộc: ["xanh lá"],
  Thủy: ["đen", "xanh navy"],
  Hỏa: ["đỏ", "hồng"],
  Thổ: ["vàng", "nâu"],
};

function parseElementTokens(raw: string): string[] {
  return raw
    .split(/[·,;/|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "—");
}

/** Gợi ý màu sắc cho card Dụng/Kỵ — maket `CLaSoFull`. */
export function thanColorsHintVi(thanField: string): string | null {
  if (!thanField || thanField === "—") return null;
  const colors = new Set<string>();
  for (const token of parseElementTokens(thanField)) {
    for (const [element, palette] of Object.entries(ELEMENT_COLOR_TOKENS)) {
      if (token.includes(element)) {
        for (const c of palette) colors.add(c);
      }
    }
  }
  if (colors.size === 0) return null;
  return `Mầu ${[...colors].join(", ")}`;
}

function extractThapThanDominant(raw: unknown): string | null {
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.tu_tru) ??
    root;
  const thap = asRecord(nested.thap_than) ?? asRecord(nested.thapThan);
  if (!thap) return null;
  const dom = asRecord(thap.dominant);
  if (dom) {
    const n = pickStr(dom, ["name", "label"]);
    if (n !== "—") return n;
  }
  const flat = pickStr(thap, ["dominant", "name", "label"]);
  return flat !== "—" ? flat : null;
}

function topNguHanhPct(nguHanh: Record<string, number>): {
  label: string;
  pct: number;
} | null {
  let bestKey: string | null = null;
  let best = 0;
  for (const [k, v] of Object.entries(nguHanh)) {
    if (v > best) {
      best = v;
      bestKey = k;
    }
  }
  if (!bestKey || best <= 0) return null;
  const labels: Record<string, string> = {
    kim: "Kim",
    moc: "Mộc",
    thuy: "Thủy",
    hoa: "Hỏa",
    tho: "Thổ",
  };
  return { label: labels[bestKey] ?? bestKey, pct: Math.round(best) };
}

/** Teaser deterministic trên màn 17 — facts lá số, không marketing copy. */
export function buildLaSoNlttTeaser(
  raw: unknown,
  reveal: NonNullable<ReturnType<typeof laSoJsonToRevealProps>>,
  detail: LaSoChiTietView,
): string {
  const sentences: string[] = [];

  if (reveal.nhatChu !== "—" && reveal.hanh !== "—") {
    sentences.push(`Nhật chủ ${reveal.nhatChu} ${reveal.hanh}`);
  }

  if (reveal.dungThan !== "—" && reveal.kyThan !== "—") {
    sentences.push(
      `Dụng ${reveal.dungThan} — tránh ${reveal.kyThan} khi chọn ngày và việc quan trọng`,
    );
  } else if (reveal.dungThan !== "—") {
    sentences.push(`Dụng ${reveal.dungThan} giúp cân bằng lá số`);
  }

  const thap = extractThapThanDominant(raw);
  if (thap) {
    sentences.push(`Thập thần nổi bật: ${thap}`);
  }

  const top = topNguHanhPct(detail.nguHanh);
  if (top && top.pct >= 22) {
    sentences.push(`${top.label} chiếm ${top.pct}% trong lá số`);
  }

  const activeDv = detail.daiVanList.find((x) => x.isActive);
  if (activeDv && activeDv.label !== "—" && activeDv.label !== "Đại Vận") {
    const years =
      activeDv.years !== "—" ? ` (${activeDv.years} tuổi)` : "";
    sentences.push(`Đại vận ${activeDv.label}${years} đang chi phối vận trình`);
  }

  if (sentences.length === 0) {
    const menh = reveal.menh !== "—" ? reveal.menh : "lá số";
    return `${menh} — đọc luận giải Bát tự để hiểu tính cách, vận năm và gợi ý thực tế.`;
  }

  return `${sentences.slice(0, 3).join(". ")}.`;
}
