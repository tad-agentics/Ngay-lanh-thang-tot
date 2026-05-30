import { describe, expect, it } from "vitest";

import {
  buildSuggestedPickLabels,
  goodForFromSavedPickPayload,
  labelToIntent,
  pickMarkLabelForNav,
  SAVED_PICK_GENERIC_LABEL,
} from "./saved-pick-mark";

describe("saved-pick-mark", () => {
  it("maps labels to intents", () => {
    expect(labelToIntent("An táng")).toBe("AN_TANG");
    expect(labelToIntent(SAVED_PICK_GENERIC_LABEL)).toBe("MAC_DINH");
    expect(labelToIntent("Cưới hỏi")).toBe("CUOI_HOI");
    expect(labelToIntent("Lễ cưới")).toBe("DAM_CUOI");
  });

  it("pickMarkLabelForNav prefers stored label for MAC_DINH", () => {
    expect(
      pickMarkLabelForNav({ intent: "MAC_DINH", v: "Việc riêng của tôi" }),
    ).toBe("Việc riêng của tôi");
    expect(pickMarkLabelForNav({ intent: "AN_TANG", v: "An táng" })).toBe("An táng");
  });

  it("extracts good_for from saved day-detail payload", () => {
    const goodFor = goodForFromSavedPickPayload({
      good_for: ["Đám cưới", "Xuất hành"],
    });
    expect(goodFor).toEqual(["Đám cưới", "Xuất hành"]);
  });

  it("builds unique suggestions with generic fallback", () => {
    const chips = buildSuggestedPickLabels({
      prefill: "Đám cưới",
      goodFor: ["Đám cưới", "Xuất hành"],
    });
    expect(chips[0]).toBe("Đám cưới");
    expect(chips).toContain(SAVED_PICK_GENERIC_LABEL);
    expect(chips.filter((c) => c === "Đám cưới")).toHaveLength(1);
  });
});
