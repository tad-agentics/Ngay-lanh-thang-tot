import type { LaSoJson } from "~/lib/api-types";
import { currentYearVn } from "~/lib/bazi-reading-session";
import type { LaSoChiTietSection } from "~/lib/generate-reading";
import {
  parseLuuNienFactsView,
  type DaiVanNextView,
  type LuuNienFactsView,
  type LuuNienQuyNhanFacts,
} from "~/lib/luu-nien-facts-ui";
import {
  parsePersonalityTraitsFromLaSo,
  type PersonalityTraitView,
} from "~/lib/personality-traits-ui";
import {
  parsePhongThuyFactsView,
  type PhongThuyFactsView,
} from "~/lib/phong-thuy-facts-ui";

export type BaziOutlineKey =
  | "menh_tong_quan"
  | "tinh_cach"
  | "van_nam"
  | "phong_thuy"
  | "quy_nhan";

export type BaziOutlineSection = {
  key: BaziOutlineKey;
  index: number;
  title: string;
};

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

/** Can Chi năm đang luận (vd. Bính Ngọ) — từ `la-so/luu-nien` facts. */
export function flowYearCanChiFromFacts(data: unknown): string | null {
  const parsed = parseLuuNienFactsView(data);
  if (parsed?.yearCanChi) return parsed.yearCanChi;
  const root = asRecord(data);
  if (!root) return null;
  const layers = [root, asRecord(root.data), asRecord(root.result)].filter(
    (x): x is Record<string, unknown> => x != null,
  );
  for (const layer of layers) {
    const direct = pickStr(layer, [
      "year_can_chi",
      "yearCanChi",
      "can_chi_year",
      "year_label_vi",
      "yearLabelVi",
    ]);
    if (direct) return direct;
  }
  return null;
}

export function baziOutlineSections(yearCanChi: string): BaziOutlineSection[] {
  const y = yearCanChi.trim();
  const vanLabel = y ? `Vận năm ${y}` : "Vận năm";
  const ptLabel = y ? `Phong thủy ${y}` : "Phong thủy năm";
  return [
    { key: "menh_tong_quan", index: 1, title: "Mệnh tổng quan" },
    { key: "tinh_cach", index: 2, title: "Tính cách · cá tính" },
    { key: "van_nam", index: 3, title: vanLabel },
    { key: "phong_thuy", index: 4, title: ptLabel },
    { key: "quy_nhan", index: 5, title: "Quý nhân · lưu ý" },
  ];
}

export type BaziDisplayChapter =
  | {
      key: "menh_tong_quan";
      index: number;
      title: string;
      kind: "menh";
      laSo: LaSoJson | null;
      prose: string;
      emptyReason: string | null;
    }
  | {
      key: "tinh_cach";
      index: number;
      title: string;
      kind: "tinh_cach";
      traits: PersonalityTraitView[];
      introProse: string;
      prose: string;
      emptyReason: string | null;
    }
  | {
      key: "van_nam";
      index: number;
      title: string;
      kind: "van_nam";
      facts: LuuNienFactsView | null;
      prose: string;
      emptyReason: string | null;
    }
  | {
      key: "phong_thuy";
      index: number;
      title: string;
      kind: "phong_thuy";
      facts: PhongThuyFactsView | null;
      prose: string;
      emptyReason: string | null;
    }
  | {
      key: "quy_nhan";
      index: number;
      title: string;
      kind: "quy_nhan";
      quyNhan: LuuNienQuyNhanFacts | null;
      daiVanNext: DaiVanNextView | null;
      prose: string;
      emptyReason: string | null;
    };

function sectionText(sections: LaSoChiTietSection[], id: string): string {
  return sections.find((x) => x.id === id)?.text?.trim() ?? "";
}

function joinSectionTexts(
  list: LaSoChiTietSection[],
  filter?: (s: LaSoChiTietSection) => boolean,
): string {
  const items = filter ? list.filter(filter) : list;
  return items
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

const LUU_NIEN_UNG_XU_ID = "luu_nien_ung_xu";

function isLuuNienSection(s: LaSoChiTietSection): boolean {
  return s.id.startsWith("luu_nien_");
}

/** §03 — mọi phần lưu niên trừ ứng xử / quý nhân. */
function luuNienVanNamProse(sections: LaSoChiTietSection[]): string {
  return joinSectionTexts(
    sections,
    (s) => isLuuNienSection(s) && s.id !== LUU_NIEN_UNG_XU_ID,
  );
}

/** §05 — chỉ `luu_nien_ung_xu`; không fallback sang §03. */
function luuNienQuyNhanProse(sections: LaSoChiTietSection[]): string {
  return sectionText(sections, LUU_NIEN_UNG_XU_ID);
}

/** Luôn 5 § Direction C màn 18 — kể cả khi thiếu API/Gemini. */
export function buildBaziDisplayChapters(input: {
  sections: LaSoChiTietSection[];
  laSo: LaSoJson | null;
  luuNienFactsRaw: unknown | null;
  phongThuyFactsRaw: unknown | null;
  yearCanChi: string;
}): BaziDisplayChapter[] {
  const outline = baziOutlineSections(input.yearCanChi);
  const luuParsed = input.luuNienFactsRaw
    ? parseLuuNienFactsView(input.luuNienFactsRaw)
    : null;
  const ptParsed = input.phongThuyFactsRaw
    ? parsePhongThuyFactsView(input.phongThuyFactsRaw)
    : null;

  const menhProse = sectionText(input.sections, "menh_tong_quan");
  const traits = parsePersonalityTraitsFromLaSo(input.laSo);
  const tinhCachGemini = sectionText(input.sections, "tinh_cach");
  const vanProse = luuNienVanNamProse(input.sections);
  const ptProse = joinSectionTexts(input.sections, (s) =>
    s.id.startsWith("phong_thuy_"),
  );
  const quyProse = luuNienQuyNhanProse(input.sections);

  const hasLaSo =
    input.laSo != null &&
    typeof input.laSo === "object" &&
    Object.keys(input.laSo as object).length > 0;

  return outline.map((meta) => {
    switch (meta.key) {
      case "menh_tong_quan":
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "menh",
          laSo: input.laSo,
          prose: menhProse,
          emptyReason: hasLaSo
            ? menhProse
              ? null
              : "Chưa tạo được luận tổng quan lá số. Thử tải lại sau."
            : "Chưa có lá số trên hồ sơ.",
        };
      case "tinh_cach":
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "tinh_cach",
          traits,
          introProse: traits.length > 0 ? tinhCachGemini : "",
          prose: traits.length === 0 ? tinhCachGemini : "",
          emptyReason:
            tinhCachGemini || traits.length > 0
              ? null
              : "Chưa tạo được luận giải tính cách. Thử tải lại sau.",
        };
      case "van_nam":
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "van_nam",
          facts: luuParsed,
          prose: vanProse,
          emptyReason:
            luuParsed || vanProse
              ? null
              : "Chưa có dữ liệu vận năm. Kiểm tra kết nối hoặc thử lại.",
        };
      case "phong_thuy":
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "phong_thuy",
          facts: ptParsed,
          prose: ptProse,
          emptyReason:
            ptParsed || ptProse
              ? null
              : "Chưa có dữ liệu phong thủy năm. Thử tải lại sau.",
        };
      case "quy_nhan":
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "quy_nhan",
          quyNhan: luuParsed?.quyNhan ?? null,
          daiVanNext: luuParsed?.daiVanNext ?? null,
          prose: quyProse,
          emptyReason:
            luuParsed?.quyNhan || luuParsed?.daiVanNext || quyProse
              ? null
              : "Chưa có dữ liệu quý nhân. Thử tải lại sau.",
        };
    }
  });
}

/** @deprecated Use `buildBaziDisplayChapters` */
export function organizeBaziChapters(
  sections: LaSoChiTietSection[],
  yearCanChi: string,
): BaziDisplayChapter[] {
  return buildBaziDisplayChapters({
    sections,
    laSo: null,
    luuNienFactsRaw: null,
    phongThuyFactsRaw: null,
    yearCanChi,
  });
}

/** Nhãn năm khi API chưa trả `year_can_chi` — không hardcode Can Chi. */
export function fallbackFlowYearCanChiLabel(_year: number = currentYearVn()): string {
  return "";
}
