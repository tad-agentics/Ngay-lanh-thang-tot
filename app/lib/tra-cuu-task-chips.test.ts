import { describe, expect, it } from "vitest";

import { TRA_CUU_TASK_CHIPS } from "~/lib/tra-cuu-task-chips";
import { resolveTraCuuIntentFromText } from "~/lib/tra-cuu-intent-resolve";

describe("tra-cuu-task-chips", () => {
  it("exposes 7 curated chips without Mua xe", () => {
    expect(TRA_CUU_TASK_CHIPS).toHaveLength(7);
    expect(TRA_CUU_TASK_CHIPS.map((c) => c.label)).not.toContain("Mua xe");
  });

  it("maps chip labels to intents", () => {
    for (const chip of TRA_CUU_TASK_CHIPS) {
      const resolved = resolveTraCuuIntentFromText(chip.label);
      expect(resolved?.intent).toBe(chip.intent);
    }
  });

  it("resolves fuzzy free text", () => {
    expect(resolveTraCuuIntentFromText("đám cưới")?.intent).toBe("DAM_CUOI");
    expect(resolveTraCuuIntentFromText("khai trương")?.intent).toBe("KHAI_TRUONG");
    expect(resolveTraCuuIntentFromText("xyz unknown")).toBeNull();
  });
});
