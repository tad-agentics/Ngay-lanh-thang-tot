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

function pickStrArr(obj: Record<string, unknown>, keys: string[]): string[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      return v as string[];
    }
  }
  return [];
}

function pickNguHanh(obj: Record<string, unknown>): Record<string, number> {
  const keys = ["ngu_hanh", "nguHanh", "five_elements", "nguHinh"];
  for (const k of keys) {
    const v = obj[k];
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const out: Record<string, number> = {};
    for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
      if (typeof nv === "number" && Number.isFinite(nv)) out[nk] = nv;
    }
    if (Object.keys(out).length) return out;
  }
  return { kim: 20, moc: 20, thuy: 20, hoa: 20, tho: 20 };
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

  return {
    nhatChu: pickStr(nested, [
      "nhat_chu",
      "nhatChu",
      "can_ngay",
      "nhat_chu_am",
    ]),
    nhatChuHan: pickStr(nested, [
      "nhat_chu_han",
      "nhatChuHan",
      "han_can_ngay",
    ]),
    hanh: pickStr(nested, ["hanh", "element", "ngu_hanh_ngay"]),
    menh: pickStr(nested, ["menh", "menh_chu", "nap_am", "menh_phu"]),
    dungThan: pickStr(nested, ["dung_than", "dungThan", "dung_than_ban"]),
    kyThan: pickStr(nested, ["ky_than", "kyThan", "ky_than_ban"]),
    daiVan: pickStr(nested, ["dai_van", "daiVan", "dai_van_hien_tai"]),
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
  if (!thanSat.length) thanSat = ["—"];

  const dvRaw = root.dai_van_list ?? root.daiVanList;
  let daiVanList: { label: string; years: string; isActive: boolean }[] = [];
  if (Array.isArray(dvRaw)) {
    daiVanList = dvRaw.map((item, i) => {
      const o = asRecord(item) ?? {};
      return {
        label: pickStr(o, ["label", "ten", "name", "pillar"]),
        years: pickStr(o, ["years", "nam", "range"]),
        isActive: Boolean(o.active) || Boolean(o.isActive) || i === 0,
      };
    });
  }
  if (!daiVanList.length) {
    const dv = pickStr(root, ["dai_van", "daiVan"]);
    daiVanList = [{ label: dv === "—" ? "Đại Vận" : dv, years: "—", isActive: true }];
  }

  const nguHanh = pickNguHanh(root);

  return { thienCan, diaChi, thanSat, daiVanList, nguHanh };
}
