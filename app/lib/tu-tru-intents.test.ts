import { describe, expect, it } from "vitest";

import { matchesIntentVietnameseLabel } from "./tu-tru-intents";

describe("matchesIntentVietnameseLabel", () => {
  it("matches Dạm ngõ and legacy Cưới hỏi for CUOI_HOI", () => {
    expect(matchesIntentVietnameseLabel("CUOI_HOI", "Dạm ngõ")).toBe(true);
    expect(matchesIntentVietnameseLabel("CUOI_HOI", "Cưới hỏi")).toBe(true);
    expect(matchesIntentVietnameseLabel("CUOI_HOI", "Đám cưới")).toBe(false);
  });

  it("does not treat Cưới hỏi as Đám cưới", () => {
    expect(matchesIntentVietnameseLabel("DAM_CUOI", "Cưới hỏi")).toBe(false);
    expect(matchesIntentVietnameseLabel("DAM_CUOI", "Đám cưới")).toBe(true);
  });
});
