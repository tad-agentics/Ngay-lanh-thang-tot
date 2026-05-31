import { describe, expect, it } from "vitest";

import { createInitialChapterLoadState } from "~/lib/bazi-chapter-load";
import { deriveBaziLoadProgress } from "~/lib/bazi-reading-progress";

describe("deriveBaziLoadProgress", () => {
  it("returns label for first loading chapter", () => {
    const load = createInitialChapterLoadState();
    const p = deriveBaziLoadProgress(load, "Bính Ngọ");
    expect(p).not.toBeNull();
    expect(p?.done).toBe(0);
    expect(p?.activeLabel).toContain("mệnh tổng quan");
  });

  it("returns null when all applicable chapters done", () => {
    const p = deriveBaziLoadProgress(
      {
        menh_tong_quan: "done",
        tinh_cach: "done",
        van_nam: "done",
        phong_thuy: "idle",
        quy_nhan: "idle",
      },
      "",
    );
    expect(p).toBeNull();
  });
});
