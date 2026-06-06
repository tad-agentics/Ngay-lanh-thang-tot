import { normalizeLaSoPayload } from "~/lib/la-so-normalize";
import * as H from "~/lib/la-so-ui-helpers";

/** True when `profiles.la_so` already has a persisted payload (matches Edge `bat-tu`). */
export function profileHasStoredLaso(laSo: unknown): boolean {
  if (laSo == null || typeof laSo !== "object" || Array.isArray(laSo)) {
    return false;
  }
  return Object.keys(laSo as Record<string, unknown>).length > 0;
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
  const root = H.asRecord(normalized);
  if (!root) return null;
  const nested = root;

  const pillars = H.asRecord(nested.pillars);
  const dayPillar = pillars ? H.asRecord(pillars.day) : null;
  const dayCan = dayPillar ? H.asRecord(dayPillar.can) : null;
  const dayChi = dayPillar ? H.asRecord(dayPillar.chi) : null;

  const ncObj =
    H.asRecord(nested.nhat_chu) ?? H.asRecord(nested.nhatChu) ?? null;
  let nhatChu = H.pickStrOrFromNestedObject(nested, ["nhat_chu", "nhatChu"], [
    "can_name",
    "canName",
    "stem",
    "can",
    "name",
    "label",
  ]);
  if (nhatChu === "—" && dayCan) {
    nhatChu = H.pickStr(dayCan, ["name", "can_name", "label"]);
  }

  let nhatChuHan = H.pickStr(ncObj ?? nested, [
    "nhat_chu_han",
    "nhatChuHan",
    "chi_name",
    "chiName",
    "can_han",
    "han_char",
  ]);
  if (nhatChuHan === "—" && ncObj) {
    nhatChuHan = H.pickStr(ncObj, ["chi_name", "chi_han", "han"]);
  }
  // API không trả chữ Hán; hiển thị Địa Chi ngày làm glyph lớn (UX gần với tứ trụ).
  if (nhatChuHan === "—" && dayChi) {
    nhatChuHan = H.pickStr(dayChi, ["name", "label"]);
  }

  let hanh = "—";
  if (ncObj) {
    hanh = H.pickStr(ncObj, ["hanh", "element", "ngu_hanh"]);
  }
  if (hanh === "—") {
    hanh = H.pickStr(nested, ["hanh", "element", "ngu_hanh_ngay"]);
  }
  if (hanh === "—" && dayCan) {
    hanh = H.pickStr(dayCan, ["hanh", "element"]);
  }

  let menh = H.pickStrOrFromNestedObject(nested, ["menh", "menh_chu"], [
    "nap_am_name",
    "napAmName",
    "name",
    "label",
    "ten",
  ]);
  if (menh === "—") {
    const y = pillars ? H.asRecord(pillars.year) : null;
    const nap = y ? H.asRecord(y.nap_am) : null;
    if (nap) menh = H.pickStr(nap, ["name", "nap_am_name", "label"]);
  }

  const dungThan = H.pickStrOrFromNestedObject(
    nested,
    ["dung_than", "dungThan", "dung_than_ban"],
    ["element", "name", "label", "ten"],
  );

  const kyThan = H.pickStrOrFromNestedObject(
    nested,
    ["ky_than", "kyThan", "ky_than_ban"],
    ["element", "name", "label", "ten"],
  );

  let daiVan = H.formatDaiVanField(
    nested.dai_van ??
      nested.daiVan ??
      nested.dai_van_current ??
      nested.daiVanCurrent,
  );
  if (daiVan === "—") {
    daiVan = H.pickStr(nested, ["dai_van", "daiVan", "dai_van_hien_tai"]);
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
  const root = H.asRecord(raw);
  if (!root) return null;
  const nested =
    H.asRecord(root.data) ??
    H.asRecord(root.result) ??
    H.asRecord(root.tu_tru) ??
    root;
  const props = laSoJsonToRevealProps(raw);
  const menh = props?.menh && props.menh !== "—" ? props.menh : null;

  const pillars = H.asRecord(nested.pillars);
  const year = pillars ? H.asRecord(pillars.year) : null;
  const nap = year ? H.asRecord(year.nap_am) : null;
  const moTa = nap
    ? H.pickStr(nap, ["mo_ta", "description", "tagline", "summary"])
    : "—";
  if (moTa !== "—") {
    return menh ? `${menh} — ${moTa}` : moTa;
  }
  if (menh) return `${menh} — lá số của bạn đã sẵn sàng.`;
  return null;
}

const TU_TRU_PILLAR_KEYS = ["year", "month", "day", "hour"] as const;

/** Hour pillar preview for onboarding canh picker (screen 09). */
export function extractHourPillarPreview(raw: unknown): {
  label: string;
  hanh: string;
} | null {
  const root = H.asRecord(raw);
  if (!root) return null;
  const nested =
    H.asRecord(root.data) ??
    H.asRecord(root.result) ??
    H.asRecord(root.tu_tru) ??
    root;
  const pillars = H.asRecord(nested.pillars);
  const hour = pillars ? H.asRecord(pillars.hour) : null;
  const label = H.pillarLabelFromRecord(hour);
  if (label === "···" || label === "—") return null;

  const can = hour ? H.asRecord(hour.can) : null;
  const chi = hour ? H.asRecord(hour.chi) : null;
  let hanh = can
    ? H.pickStr(can, ["hanh", "element", "ngu_hanh", "nguHanh"])
    : "—";
  if (hanh === "—" && chi) {
    hanh = H.pickStr(chi, ["hanh", "element", "ngu_hanh", "nguHanh"]);
  }
  if (hanh === "—" && hour) {
    hanh = H.pickStr(hour, ["hanh", "element", "ngu_hanh"]);
  }
  return { label, hanh: hanh !== "—" ? hanh : "—" };
}

/** Four pillars for onboarding reveal (Niên → Thời). */
export function extractTuTruPillarLabels(raw: unknown): string[] {
  const root = H.asRecord(raw);
  if (!root) return ["···", "···", "···", "···"];
  const nested =
    H.asRecord(root.data) ??
    H.asRecord(root.result) ??
    H.asRecord(root.tu_tru) ??
    root;
  const pillars = H.asRecord(nested.pillars);
  return TU_TRU_PILLAR_KEYS.map((k) =>
    H.pillarLabelFromRecord(pillars ? H.asRecord(pillars[k]) : null),
  );
}
