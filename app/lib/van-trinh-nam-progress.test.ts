import { describe, expect, it } from "vitest";

import { createInitialVanTrinhChapterLoadState } from "~/lib/van-trinh-nam-chapter-load";
import { deriveVanTrinhLoadProgress } from "~/lib/van-trinh-nam-progress";

describe("deriveVanTrinhLoadProgress", () => {
  it("returns null when all chapters done", () => {
    const load = createInitialVanTrinhChapterLoadState();
    for (const k of Object.keys(load) as (keyof typeof load)[]) {
      load[k] = "done";
    }
    expect(deriveVanTrinhLoadProgress(load, "Ất Tỵ")).toBeNull();
  });

  it("reports active month label", () => {
    const load = createInitialVanTrinhChapterLoadState();
    load.part_a = "done";
    for (let m = 1; m <= 3; m += 1) {
      load[`month_${m}`] = "done";
    }
    load.month_4 = "loading";
    const p = deriveVanTrinhLoadProgress(load, "");
    expect(p?.done).toBe(4);
    expect(p?.activeLabel).toContain("tháng 4");
  });
});
