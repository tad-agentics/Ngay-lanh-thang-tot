import type { LaSoJson } from "~/lib/api-types";
import { normalizeLaSoPayload } from "~/lib/la-so-normalize";
import * as H from "~/lib/la-so-ui-helpers";

export interface LaSoChiTietView {
  thienCan: string[];
  diaChi: string[];
  thanSat: string[];
  daiVanList: { label: string; years: string; isActive: boolean }[];
  nguHanh: Record<string, number>;
}

export function laSoJsonToChiTiet(j: LaSoJson | null | undefined): LaSoChiTietView {
  const normalized = normalizeLaSoPayload(j);
  const root = H.asRecord(normalized) ?? {};
  let thienCan = H.pickStrArr(root, ["thien_can", "thienCan", "can_list"]);
  let diaChi = H.pickStrArr(root, ["dia_chi", "diaChi", "chi_list"]);
  if (thienCan.length < 4) {
    const tu = H.asRecord(root.tu_tru) ?? H.asRecord(root.tu_tru_detail);
    if (tu) {
      thienCan = H.pickStrArr(tu, ["thien_can", "thienCan"]);
      diaChi = H.pickStrArr(tu, ["dia_chi", "diaChi"]);
    }
  }
  if (thienCan.length < 4) {
    const pillars = H.asRecord(root.pillars);
    if (pillars) {
      /** UI: cột Giờ → Ngày → Tháng → Năm (trái sang phải) */
      const order = ["hour", "day", "month", "year"] as const;
      const cans: string[] = [];
      const chis: string[] = [];
      for (const key of order) {
        const p = H.asRecord(pillars[key]);
        const can = p ? H.asRecord(p.can) : null;
        const chi = p ? H.asRecord(p.chi) : null;
        const cn = can ? H.pickStr(can, ["name", "label"]) : "—";
        const ch = chi ? H.pickStr(chi, ["name", "label"]) : "—";
        if (cn !== "—") cans.push(cn);
        if (ch !== "—") chis.push(ch);
      }
      if (cans.length) thienCan = cans;
      if (chis.length) diaChi = chis;
    }
  }
  thienCan = H.padTru(thienCan, 4);
  diaChi = H.padTru(diaChi, 4);

  let thanSat = H.pickStrArr(root, ["than_sat", "thanSat", "cat_than"]);
  if (!thanSat.length) {
    const ts = root.cat_than ?? root.than_sat_list;
    if (Array.isArray(ts)) {
      thanSat = ts
        .map((x) => (typeof x === "string" ? x : (x as { name?: string }).name))
        .filter((x): x is string => typeof x === "string" && x.length > 0);
    }
  }
  if (!thanSat.length) {
    const thap = H.asRecord(root.thap_than) ?? H.asRecord(root.thapThan);
    if (thap) {
      const seen = new Set<string>();
      const keys = ["dominant", "year", "month", "day", "hour"] as const;
      for (const k of keys) {
        const o = H.asRecord(thap[k]);
        if (!o) continue;
        const n = H.pickStr(o, ["name", "label"]);
        if (n !== "—" && !seen.has(n)) {
          seen.add(n);
          thanSat.push(n);
        }
      }
    }
  }
  if (!thanSat.length) thanSat = ["—"];

  const { listRaw: dvRaw, parentObj: dvParent } = H.getDaiVanContext(root);
  let daiVanList: { label: string; years: string; isActive: boolean }[] = [];
  if (Array.isArray(dvRaw)) {
    daiVanList = dvRaw.map((item) => {
      const o = H.asRecord(item) ?? {};
      return {
        label: H.pickStr(o, [
          "display",
          "label",
          "can_chi",
          "canChi",
          "ten",
          "name",
          "pillar",
        ]),
        years: H.pickDaiVanYearsFromObject(o),
        isActive:
          Boolean(o.active) ||
          Boolean(o.isActive) ||
          Boolean(o.is_current) ||
          o.current === true,
      };
    });
    daiVanList = H.applyCurrentToDaiVanRows(daiVanList, dvParent);
    daiVanList = H.preferCurrentYearsOnActiveRow(daiVanList, dvParent);
    daiVanList = H.injectCurrentDaiVanIfMissingFromList(daiVanList, dvParent);
    if (!daiVanList.some((x) => x.isActive) && daiVanList.length === 1) {
      daiVanList = [{ ...daiVanList[0], isActive: true }];
    }
  }
  if (!daiVanList.length) {
    const dvObj = dvParent;
    const cycles = dvObj ? dvObj.cycles : undefined;
    const current = dvObj ? H.asRecord(dvObj.current) : null;
    const curLabel = current ? H.pickStr(current, ["display", "label"]) : "—";
    const curYears =
      current != null ? H.pickDaiVanCurrentYearsFromObject(current) : "—";
    if (dvObj && Array.isArray(cycles)) {
      daiVanList = cycles.map((item) => {
        const o = H.asRecord(item) ?? {};
        const label = H.pickStr(o, ["display", "label", "name"]);
        const years = H.pickDaiVanYearsFromObject(o);
        const isActive =
          (curLabel !== "—" &&
            label !== "—" &&
            label.trim() === curLabel.trim()) ||
          (curYears !== "—" &&
            years !== "—" &&
            H.normalizeAgeRangeKey(years) === H.normalizeAgeRangeKey(curYears));
        return { label, years, isActive };
      });
      daiVanList = H.preferCurrentYearsOnActiveRow(daiVanList, dvObj);
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
    const layers = [root, H.asRecord(root.data), H.asRecord(root.result)].filter(
      (x): x is Record<string, unknown> => x != null,
    );
    let dv = "—";
    for (const layer of layers) {
      dv = H.pickStr(layer, ["dai_van", "daiVan"]);
      if (dv !== "—") break;
      const po = H.asRecord(layer.dai_van) ?? H.asRecord(layer.daiVan);
      if (po) {
        const formatted = H.formatDaiVanField(po);
        if (formatted !== "—") {
          dv = formatted;
          break;
        }
      }
      const dvf =
        H.asRecord(layer.dai_van_current) ?? H.asRecord(layer.daiVanCurrent);
      if (dvf) {
        const formatted = H.formatDaiVanField(dvf);
        if (formatted !== "—") {
          dv = formatted;
          break;
        }
      }
    }
    daiVanList = [{ label: dv === "—" ? "Đại Vận" : dv, years: "—", isActive: true }];
  }

  const nguHanh = H.pickNguHanh(root);

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
  const raw = H.asRecord(layer._raw);
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
  return H.asRecord(normalized);
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
    const hit = tryLayerElementCountsEnrichment(H.asRecord(r[k]));
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
      const inner = H.asRecord(layer[nestKey]);
      if (!inner) continue;
      for (const [k, v] of Object.entries(pickLaSoEnrichmentFields(inner))) {
        if (out[k] == null) out[k] = v;
      }
    }
    const counts = tryLayerElementCountsEnrichment(layer);
    if (counts?._raw) {
      const raw = H.asRecord(out._raw) ?? {};
      out._raw = { ...raw, ...(counts._raw as Record<string, unknown>) };
    }
  }

  if (Object.keys(out).length > 0) return out;

  return (
    tryNestedElementCountsEnrichment(root) ??
    tryNestedElementCountsEnrichment(H.asRecord(root.data)) ??
    tryNestedElementCountsEnrichment(H.asRecord(root.result))
  );
}

export function mergeLaSoJsonForChiTietDisplay(
  stored: LaSoJson | null | undefined,
  enrichment: Record<string, unknown> | null | undefined,
): LaSoJson | null | undefined {
  if (!enrichment || Object.keys(enrichment).length === 0) return stored;
  if (!stored) return enrichment as LaSoJson;
  const s = stored as Record<string, unknown>;
  const e = enrichment;
  const out: Record<string, unknown> = { ...s, ...e };
  const sRaw = H.asRecord(s._raw);
  const eRaw = H.asRecord(e._raw);
  if (sRaw && eRaw) {
    out._raw = { ...sRaw, ...eRaw };
  }
  return out as LaSoJson;
}

/** Nap âm mô tả ngắn — italic quote dưới headline màn 17 (`CLaSoFull`). */
export function extractMenhMoTa(raw: unknown): string | null {
  const root = H.asRecord(raw);
  if (!root) return null;
  const nested =
    H.asRecord(root.data) ??
    H.asRecord(root.result) ??
    H.asRecord(root.tu_tru) ??
    root;
  const pillars = H.asRecord(nested.pillars);
  const year = pillars ? H.asRecord(pillars.year) : null;
  const nap = year ? H.asRecord(year.nap_am) : null;
  const moTa = nap
    ? H.pickStr(nap, ["mo_ta", "description", "tagline", "summary"])
    : "—";
  return moTa !== "—" ? moTa : null;
}
