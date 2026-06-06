import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  gioSinhToBatTuBirthTime,
} from "~/lib/bat-tu-birth";

export function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

export function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

/** If `fieldKeys` map to an object (tu-tru-api style), read string from `nestedKeys` inside it. */
export function pickStrOrFromNestedObject(
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

export function numOrStrToInt(x: unknown): number | null {
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
export function pickDaiVanYearsFromObject(o: Record<string, unknown>): string {
  return pickDaiVanCurrentYearsFromObject(o);
}

/**
 * Khoảng tuổi **đại vận hiện tại** — ưu tiên tuổi mụ / âm lịch hơn `age_range` (chu kỳ dương).
 * GET `/v1/la-so` thường tách `dai_van_current` hoặc `age_range_muc` khỏi `dai_van_list[].years`.
 */
export function pickDaiVanCurrentYearsFromObject(o: Record<string, unknown>): string {
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

export function mergeDaiVanCurrentRecords(
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
export function mergeDaiVanParentCurrent(
  parentObj: Record<string, unknown> | null,
  flatCurrent: Record<string, unknown>,
): Record<string, unknown> {
  const hasFlat =
    pickStr(flatCurrent, ["display", "label", "name", "ten", "pillar"]) !==
      "—" || pickDaiVanCurrentYearsFromObject(flatCurrent) !== "—";
  if (!hasFlat) return parentObj ?? { current: flatCurrent };
  if (!parentObj) return { current: flatCurrent };
  const cur = asRecord(parentObj.current);
  if (!cur) return { ...parentObj, current: flatCurrent };
  return { ...parentObj, current: mergeDaiVanCurrentRecords(cur, flatCurrent) };
}

export function formatDaiVanField(daiVanRaw: unknown): string {
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
export function normalizeAgeRangeKey(s: string): string {
  return s.replace(/[–—]/g, "-").replace(/\s/g, "").trim();
}

/** Gom ngữ cảnh đại vận: danh sách vận và/hoặc object `dai_van` có `current`/`cycles` từ root, data, result. */
export function getDaiVanContext(root: Record<string, unknown>): {
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

export function applyCurrentToDaiVanRows(
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
export function injectCurrentDaiVanIfMissingFromList(
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
export function preferCurrentYearsOnActiveRow(
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

export function pickStrArr(obj: Record<string, unknown>, keys: string[]): string[] {
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

export function stripViCombining(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Map nhãn API (latin hoặc có dấu) → khóa cố định cho UI. */
export function canonNguHanhKey(raw: string): string {
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

export function parseNguHanhNumber(nv: unknown): number | null {
  if (typeof nv === "number" && Number.isFinite(nv)) return nv;
  if (typeof nv === "string") {
    const n = Number.parseFloat(nv.replace(/%/g, "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function extractNguHanhFromLayer(
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
export function extractNguHanhFromElementCounts(
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
export function padFiveElements(hit: Record<string, number>): Record<string, number> {
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
export function pickNguHanh(root: Record<string, unknown>): Record<string, number> {
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

export function padTru(a: string[], n: number): string[] {
  const x = [...a];
  while (x.length < n) x.push("—");
  return x.slice(0, n);
}

export function pillarLabelFromRecord(
  p: Record<string, unknown> | null,
): string {
  if (!p) return "···";
  const can = asRecord(p.can);
  const chi = asRecord(p.chi);
  const c = can ? pickStr(can, ["name", "can_name", "label"]) : "—";
  const ch = chi ? pickStr(chi, ["name", "chi_name", "label"]) : "—";
  if (c !== "—" && ch !== "—") return `${c} ${ch}`.trim();
  const flat = pickStr(p, ["label", "name", "ganzhi", "display"]);
  return flat !== "—" ? flat : "···";
}

export function hanhFromPillarRecord(
  p: Record<string, unknown> | null,
): string {
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

export function ageFromNgaySinh(
  ngaySinh: string | null | undefined,
): number | null {
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

export function gioSinhSublineVi(
  gioSinh: string | null | undefined,
): string | null {
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
