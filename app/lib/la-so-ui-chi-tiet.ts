import type { LaSoJson } from "~/lib/api-types";
import { normalizeLaSoPayload } from "~/lib/la-so-normalize";
import * as H from "~/lib/la-so-ui-helpers";
import {
  type LaSoChiTietView,
  extractLaSoChiTietEnrichment,
  extractMenhMoTa,
  laSoJsonToChiTiet,
  mergeLaSoJsonForChiTietDisplay,
} from "~/lib/la-so-ui-chi-tiet-core";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui-reveal";

export type { LaSoChiTietView };
export {
  laSoJsonToChiTiet,
  extractLaSoChiTietEnrichment,
  mergeLaSoJsonForChiTietDisplay,
  extractMenhMoTa,
};

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
  const root = H.asRecord(normalized);
  if (!root) return [];
  const nested = root;
  const pillars = H.asRecord(nested.pillars);
  const detail = laSoJsonToChiTiet(raw as LaSoJson);
  const keys = ["year", "month", "day", "hour"] as const;
  const labels = ["Niên", "Nguyệt", "Nhật", "Thời"] as const;

  return keys.map((key, i) => {
    const p = pillars ? H.asRecord(pillars[key]) : null;
    const arrIdx = 3 - i;
    let canChi = H.pillarLabelFromRecord(p);
    if (canChi === "···" || canChi === "—") {
      const can = detail.thienCan[arrIdx] ?? "—";
      const chi = detail.diaChi[arrIdx] ?? "—";
      canChi = can !== "—" && chi !== "—" ? `${can} ${chi}` : can;
    }

    let subline = "—";
    if (key === "year") {
      const age = H.ageFromNgaySinh(profile?.ngay_sinh);
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
      subline = H.gioSinhSublineVi(profile?.gio_sinh) ?? "giờ sinh";
    }

    return {
      label: labels[i]!,
      canChi,
      hanh: H.hanhFromPillarRecord(p),
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
  const root = H.asRecord(raw);
  if (!root) return null;
  const nested =
    H.asRecord(root.data) ??
    H.asRecord(root.result) ??
    H.asRecord(root.tu_tru) ??
    root;
  const thap = H.asRecord(nested.thap_than) ?? H.asRecord(nested.thapThan);
  if (!thap) return null;
  const dom = H.asRecord(thap.dominant);
  if (dom) {
    const n = H.pickStr(dom, ["name", "label"]);
    if (n !== "—") return n;
  }
  const flat = H.pickStr(thap, ["dominant", "name", "label"]);
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
