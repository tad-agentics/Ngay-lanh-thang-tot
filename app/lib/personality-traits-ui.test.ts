import { describe, expect, it } from "vitest";

import { parsePersonalityTraitsFromLaSo } from "./personality-traits-ui";

describe("parsePersonalityTraitsFromLaSo", () => {
  it("reads personality_traits from LaSoResponse", () => {
    const traits = parsePersonalityTraitsFromLaSo({
      personality_traits: [
        { id: "strength", title: "Điểm mạnh", text: "A" },
        { id: "note", title: "Lưu ý", text: "B" },
      ],
    });
    expect(traits).toHaveLength(2);
    expect(traits[0]?.title).toBe("Điểm mạnh");
  });

  it("returns empty for missing payload", () => {
    expect(parsePersonalityTraitsFromLaSo(null)).toEqual([]);
  });
});
