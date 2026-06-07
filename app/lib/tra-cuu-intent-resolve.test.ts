import { describe, expect, it } from "vitest";

import { resolveTraCuuIntentFromText } from "~/lib/tra-cuu-intent-resolve";

describe("resolveTraCuuIntentFromText", () => {
  it("matches curated chip labels", () => {
    expect(resolveTraCuuIntentFromText("Khai trương")).toEqual({
      intent: "KHAI_TRUONG",
      label: "Khai trương",
    });
  });

  it("matches partial Vietnamese input", () => {
    const r = resolveTraCuuIntentFromText("ký hợp");
    expect(r?.intent).toBe("KY_HOP_DONG");
  });

  it("returns null for empty or unknown text", () => {
    expect(resolveTraCuuIntentFromText("")).toBeNull();
    expect(resolveTraCuuIntentFromText("   ")).toBeNull();
    expect(resolveTraCuuIntentFromText("mua xe")).toBeNull();
  });
});
