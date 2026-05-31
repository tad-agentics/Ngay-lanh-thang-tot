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
  hasLuuNienLifeLuanFromSections,
  luuNienYearIntroFromSections,
  mergeLuuNienLifeAreasWithLuan,
  type LuuNienLifeAreaView,
} from "~/lib/luu-nien-life-ui";
import {
  hasTinhCachLuanFromSections,
  parsePersonalityTraitsFromLaSo,
  parsePersonalityTraitsFromSections,
  tinhCachIntroFromSections,
  type PersonalityTraitView,
} from "~/lib/personality-traits-ui";

const SKELETON_TINH_CACH_TRAITS: PersonalityTraitView[] = [
  { id: "diem_manh", title: "Điểm mạnh", text: "" },
  { id: "ca_tinh", title: "Cá tính nổi bật", text: "" },
  { id: "can_luu", title: "Điểm cần lưu ý", text: "" },
  { id: "tinh_cam", title: "Tình cảm & quan hệ", text: "" },
];
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
      proseLoading?: boolean;
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
      luanLoading?: boolean;
      emptyReason: string | null;
    }
  | {
      key: "van_nam";
      index: number;
      title: string;
      kind: "van_nam";
      facts: LuuNienFactsView | null;
      yearIntroProse: string;
      lifeAreas: LuuNienLifeAreaView[];
      prose: string;
      luanLoading?: boolean;
      emptyReason: string | null;
    }
  | {
      key: "phong_thuy";
      index: number;
      title: string;
      kind: "phong_thuy";
      facts: PhongThuyFactsView | null;
      prose: string;
      proseLoading?: boolean;
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
      proseLoading?: boolean;
      emptyReason: string | null;
    };

function sectionText(sections: LaSoChiTietSection[], id: string): string {
  return sections.find((x) => x.id === id)?.text?.trim() ?? "";
}

/** §01 — `menh_tong_quan`, hoặc `tong_hop` / section đầu khi Edge trả prose fallback. */
export function menhTongQuanProseFromSections(
  sections: LaSoChiTietSection[],
): string {
  const menh = sectionText(sections, "menh_tong_quan");
  if (menh) return menh;
  const tongHop = sectionText(sections, "tong_hop");
  if (tongHop) return tongHop;
  return sections[0]?.text?.trim() ?? "";
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
const LUU_NIEN_YEAR_INTRO_ID = "luu_nien_year_intro";
const LUU_NIEN_LIFE_PREFIX = "luu_nien_life_";

function isLuuNienVanNamProseSection(s: LaSoChiTietSection): boolean {
  if (!s.id.startsWith("luu_nien_")) return false;
  if (s.id === LUU_NIEN_UNG_XU_ID) return false;
  if (s.id === LUU_NIEN_YEAR_INTRO_ID) return false;
  if (s.id.startsWith(LUU_NIEN_LIFE_PREFIX)) return false;
  return true;
}

/** §03 — nhịp năm / thực tiễn (không gồm 4 lĩnh vực LLM hay ứng xử §05). */
function luuNienVanNamProse(sections: LaSoChiTietSection[]): string {
  return joinSectionTexts(sections, isLuuNienVanNamProseSection);
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
  phongThuyFetchError?: string | null;
  /** Facts đã có — chờ LLM; không hiện emptyReason cho § có dữ liệu. */
  luanPending?: boolean;
}): BaziDisplayChapter[] {
  const luanPending = input.luanPending === true;
  const outline = baziOutlineSections(input.yearCanChi);
  const luuParsed = input.luuNienFactsRaw
    ? parseLuuNienFactsView(input.luuNienFactsRaw)
    : null;
  const ptParsed = input.phongThuyFactsRaw
    ? parsePhongThuyFactsView(input.phongThuyFactsRaw)
    : null;

  const menhProse = menhTongQuanProseFromSections(input.sections);
  const traits = parsePersonalityTraitsFromSections(input.sections);
  const tinhCachIntro = tinhCachIntroFromSections(input.sections);
  const tinhCachLegacy = sectionText(input.sections, "tinh_cach");
  const yearIntroProse = luuNienYearIntroFromSections(input.sections);
  const lifeAreas = mergeLuuNienLifeAreasWithLuan(luuParsed, input.sections);
  const vanProse = luuNienVanNamProse(input.sections);
  const ptProse = joinSectionTexts(input.sections, (s) =>
    s.id.startsWith("phong_thuy_"),
  );
  const quyProse = luuNienQuyNhanProse(input.sections);
  const hasVanLuan =
    hasLuuNienLifeLuanFromSections(
      input.sections,
      Math.max(1, luuParsed?.lifeAreas.length ?? 4),
    ) ||
    lifeAreas.some((a) => a.luan.length > 0) ||
    Boolean(yearIntroProse.trim()) ||
    Boolean(vanProse.trim());

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
          proseLoading: luanPending && hasLaSo && !menhProse,
          emptyReason: hasLaSo
            ? menhProse || luanPending
              ? null
              : "Chưa tạo được luận tổng quan lá số. Thử tải lại luận."
            : "Chưa có lá số trên hồ sơ.",
        };
      case "tinh_cach": {
        const hasLuan =
          hasTinhCachLuanFromSections(input.sections) ||
          traits.some((t) => t.text.trim().length > 0) ||
          Boolean(tinhCachIntro.trim()) ||
          Boolean(tinhCachLegacy.trim());
        const skeletonTraits = (() => {
          if (!luanPending || hasLuan) return traits;
          const fromLaSo = parsePersonalityTraitsFromLaSo(input.laSo).map((t) => ({
            ...t,
            text: "",
          }));
          return fromLaSo.length > 0 ? fromLaSo : SKELETON_TINH_CACH_TRAITS;
        })();
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "tinh_cach",
          traits: skeletonTraits,
          introProse: tinhCachIntro || (traits.length === 0 ? tinhCachLegacy : ""),
          prose: traits.length === 0 ? tinhCachLegacy : "",
          luanLoading: luanPending && !hasLuan && skeletonTraits.length > 0,
          emptyReason:
            hasLuan || luanPending
              ? null
              : "Chưa tạo được luận giải tính cách. Thử tải lại luận.",
        };
      }
      case "van_nam":
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "van_nam",
          facts: luuParsed,
          yearIntroProse,
          lifeAreas,
          prose: vanProse,
          luanLoading:
            luanPending &&
            Boolean(luuParsed) &&
            !hasVanLuan,
          emptyReason:
            hasVanLuan || luuParsed || luanPending
              ? null
              : "Chưa có dữ liệu vận năm. Kiểm tra kết nối hoặc thử lại.",
        };
      case "phong_thuy": {
        const ptEmpty =
          input.phongThuyFetchError?.trim() ||
          (ptParsed || ptProse
            ? null
            : "API chưa trả hướng/màu/phi tinh — thử Tải lại luận sau.");
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "phong_thuy",
          facts: ptParsed,
          prose: ptProse,
          proseLoading: luanPending && Boolean(ptParsed) && !ptProse,
          emptyReason:
            ptParsed || ptProse || luanPending ? null : ptEmpty,
        };
      }
      case "quy_nhan":
        return {
          key: meta.key,
          index: meta.index,
          title: meta.title,
          kind: "quy_nhan",
          quyNhan: luuParsed?.quyNhan ?? null,
          daiVanNext: luuParsed?.daiVanNext ?? null,
          prose: quyProse,
          proseLoading:
            luanPending &&
            Boolean(luuParsed?.quyNhan || luuParsed?.daiVanNext) &&
            !quyProse,
          emptyReason:
            luuParsed?.quyNhan || luuParsed?.daiVanNext || quyProse || luanPending
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
