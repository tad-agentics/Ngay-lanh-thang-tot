import type { LaSoChiTietSection } from "~/lib/generate-reading";

export type VanTrinhChapterKey =
  | "part_a"
  | `month_${number}`
  | "closing";

export type VanTrinhChapterLoadStatus = "idle" | "loading" | "done" | "failed";

export type VanTrinhChapterLoadState = Record<
  VanTrinhChapterKey,
  VanTrinhChapterLoadStatus
>;

export function createInitialVanTrinhChapterLoadState(): VanTrinhChapterLoadState {
  const state = { part_a: "loading", closing: "loading" } as VanTrinhChapterLoadState;
  for (let m = 1; m <= 12; m += 1) {
    state[`month_${m}`] = "loading";
  }
  return state;
}

const A3_IDS = ["su_nghiep", "tai_loc", "tinh_cam", "suc_khoe"] as const;

function sectionText(sections: LaSoChiTietSection[], id: string): string {
  return sections.find((s) => s.id === id)?.text?.trim() ?? "";
}

function partADone(sections: LaSoChiTietSection[]): boolean {
  if (sectionText(sections, "a1_hook").length < 80) return false;
  if (sectionText(sections, "a2_you").length < 80) return false;
  return A3_IDS.every((id) => sectionText(sections, `a3_${id}`).length >= 60);
}

function monthDone(sections: LaSoChiTietSection[], month: number): boolean {
  const p = `b${month}_`;
  return (
    sectionText(sections, `${p}theme`).length >= 40 &&
    sectionText(sections, `${p}emphasis`).length >= 40 &&
    sectionText(sections, `${p}actions`).length >= 30
  );
}

export function deriveVanTrinhChapterLoadState(
  sections: LaSoChiTietSection[],
  opts: { bundleFinished: boolean },
): VanTrinhChapterLoadState {
  const state = createInitialVanTrinhChapterLoadState();
  state.part_a = partADone(sections) ? "done" : opts.bundleFinished ? "failed" : "loading";
  state.closing =
    sectionText(sections, "c_closing").length >= 80
      ? "done"
      : opts.bundleFinished
        ? "failed"
        : "loading";
  for (let m = 1; m <= 12; m += 1) {
    state[`month_${m}`] = monthDone(sections, m)
      ? "done"
      : opts.bundleFinished
        ? "failed"
        : "loading";
  }
  return state;
}

export const VAN_TRINH_PROGRESS_KEYS: VanTrinhChapterKey[] = [
  "part_a",
  ...Array.from({ length: 12 }, (_, i) => `month_${i + 1}` as VanTrinhChapterKey),
  "closing",
];
