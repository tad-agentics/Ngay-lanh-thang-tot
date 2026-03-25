import type { LaSoJson } from "~/lib/api-types";

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

function formatDaiVanField(daiVanRaw: unknown): string {
  if (typeof daiVanRaw === "string" && daiVanRaw.trim()) return daiVanRaw.trim();
  const o = asRecord(daiVanRaw);
  if (!o) return "—";
  const cur = asRecord(o.current);
  if (cur) {
    const display = pickStr(cur, ["display", "label", "name", "ten"]);
    const range = pickStr(cur, ["age_range", "ageRange", "years", "nam"]);
    if (display !== "—" && range !== "—") return `${display} (${range})`;
    if (display !== "—") return display;
  }
  return pickStr(o, ["display", "label", "summary"]);
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
 * Nếu không có trường hợp lệ → placeholder đều 20% (không phải dữ liệu API).
 */
function pickNguHanh(root: Record<string, unknown>): Record<string, number> {
  const layers: Record<string, unknown>[] = [root];
  for (const k of ["data", "result", "tu_tru", "tu_tru_detail"] as const) {
    const n = asRecord(root[k]);
    if (n) layers.push(n);
  }
  for (const layer of layers) {
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
  const root = asRecord(raw);
  if (!root) return null;
  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.tu_tru) ??
    root;

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

  let hanh = pickStrOrFromNestedObject(nested, ["nhat_chu", "nhatChu"], [
    "hanh",
    "element",
    "ngu_hanh",
  ]);
  if (hanh === "—") {
    hanh = pickStr(nested, ["hanh", "element", "ngu_hanh_ngay"]);
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

  let daiVan = formatDaiVanField(nested.dai_van ?? nested.daiVan);
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

export interface LaSoChiTietView {
  thienCan: string[];
  diaChi: string[];
  thanSat: string[];
  daiVanList: { label: string; years: string; isActive: boolean }[];
  nguHanh: Record<string, number>;
}

export function laSoJsonToChiTiet(j: LaSoJson | null | undefined): LaSoChiTietView {
  const root = asRecord(j) ?? {};
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

  const dvRaw = root.dai_van_list ?? root.daiVanList;
  let daiVanList: { label: string; years: string; isActive: boolean }[] = [];
  if (Array.isArray(dvRaw)) {
    daiVanList = dvRaw.map((item, i) => {
      const o = asRecord(item) ?? {};
      return {
        label: pickStr(o, ["label", "ten", "name", "pillar", "display"]),
        years: pickStr(o, ["years", "nam", "range", "age_range"]),
        isActive: Boolean(o.active) || Boolean(o.isActive) || i === 0,
      };
    });
  }
  if (!daiVanList.length) {
    const dvObj = asRecord(root.dai_van) ?? asRecord(root.daiVan);
    const cycles = dvObj?.cycles;
    const current = dvObj ? asRecord(dvObj.current) : null;
    const curLabel = current ? pickStr(current, ["display", "label"]) : "—";
    const curYears = current ? pickStr(current, ["age_range", "years"]) : "—";
    if (Array.isArray(cycles)) {
      daiVanList = cycles.map((item) => {
        const o = asRecord(item) ?? {};
        const label = pickStr(o, ["display", "label", "name"]);
        const years = pickStr(o, ["age_range", "years", "range"]);
        const isActive =
          curLabel !== "—" && label !== "—" && label === curLabel;
        return { label, years, isActive };
      });
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
    const dv = pickStr(root, ["dai_van", "daiVan"]);
    daiVanList = [{ label: dv === "—" ? "Đại Vận" : dv, years: "—", isActive: true }];
  }

  const nguHanh = pickNguHanh(root);

  return { thienCan, diaChi, thanSat, daiVanList, nguHanh };
}
