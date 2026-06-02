import type { LaSoChiTietSection } from "~/lib/generate-reading";
import type { VanTrinhChapterLoadState } from "~/lib/van-trinh-nam-chapter-load";
import { emphasisSignalLabel, verdictSignalLabel } from "~/lib/van-trinh-nam-signals";
import type { VanTrinhNamLuanContext, VanTrinhNamMonthBlock } from "~/lib/van-trinh-nam-types";
import { deriveVanTrinhNamMonthChartValues } from "~/lib/van-trinh-nam-parse";

export type VanTrinhNamDisplayBlock =
  | {
      kind: "part_a";
      key: "part_a";
      index: number;
      title: string;
      ctx: VanTrinhNamLuanContext;
      chartValues: number[];
      sections: LaSoChiTietSection[];
      chapterLoad: VanTrinhChapterLoadState;
    }
  | {
      kind: "month";
      key: string;
      index: number;
      title: string;
      month: VanTrinhNamMonthBlock;
      sections: LaSoChiTietSection[];
      chapterLoad: VanTrinhChapterLoadState;
    }
  | {
      kind: "closing";
      key: "closing";
      index: number;
      title: string;
      prose: string;
      luanLoading: boolean;
      luanFailed: boolean;
    }
  | {
      kind: "mechanics";
      key: "mechanics";
      index: number;
      title: string;
      ctx: VanTrinhNamLuanContext;
    };

function sectionMap(sections: LaSoChiTietSection[]): Map<string, string> {
  return new Map(sections.map((s) => [s.id, s.text?.trim() ?? ""]));
}

function proseForMonth(
  sections: LaSoChiTietSection[],
  monthNum: number,
  part: "theme" | "emphasis" | "actions",
): string {
  return sectionMap(sections).get(`b${monthNum}_${part}`) ?? "";
}

function partAProse(sections: LaSoChiTietSection[], id: string): string {
  return sectionMap(sections).get(id) ?? "";
}

export function buildVanTrinhNamDisplayBlocks(opts: {
  ctx: VanTrinhNamLuanContext;
  sections: LaSoChiTietSection[];
  chapterLoad: VanTrinhChapterLoadState;
}): VanTrinhNamDisplayBlock[] {
  const { ctx, sections, chapterLoad } = opts;
  const chartValues = deriveVanTrinhNamMonthChartValues(
    ctx.part_b.luu_nguyet_months,
  );
  const blocks: VanTrinhNamDisplayBlock[] = [
    {
      kind: "part_a",
      key: "part_a",
      index: 1,
      title: "Lưu niên — cả năm",
      ctx,
      chartValues,
      sections,
      chapterLoad,
    },
  ];

  let idx = 2;
  for (const month of ctx.part_b.luu_nguyet_months) {
    const arch = month.b1_month_theme.month_archetype;
    blocks.push({
      kind: "month",
      key: `month_${month.month_num}`,
      index: idx,
      title: month.title_vi,
      month,
      sections,
      chapterLoad,
    });
    idx += 1;
  }

  const closingText = partAProse(sections, "c_closing");
  blocks.push({
    kind: "closing",
    key: "closing",
    index: idx,
    title: "Kết bài",
    prose: closingText,
    luanLoading: chapterLoad.closing === "loading" && !closingText,
    luanFailed: chapterLoad.closing === "failed" && !closingText,
  });
  idx += 1;

  blocks.push({
    kind: "mechanics",
    key: "mechanics",
    index: idx,
    title: "Thuật ngữ & cơ chế",
    ctx,
  });

  return blocks;
}

export function buildVanTrinhNamSkeletonBlocks(
  ctx: VanTrinhNamLuanContext,
): VanTrinhNamDisplayBlock[] {
  const load = {
    part_a: "loading",
    closing: "loading",
    ...Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`month_${i + 1}`, "loading"]),
    ),
  } as VanTrinhChapterLoadState;

  return buildVanTrinhNamDisplayBlocks({
    ctx,
    sections: [],
    chapterLoad: load,
  });
}

export {
  partAProse,
  proseForMonth,
  verdictSignalLabel,
  emphasisSignalLabel,
};
