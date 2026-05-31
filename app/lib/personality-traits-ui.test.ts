import { describe, expect, it } from "vitest";

import {
  parsePersonalityTraitsFromLaSo,
  parsePersonalityTraitsFromSections,
  tinhCachIntroFromSections,
} from "./personality-traits-ui";

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

describe("parsePersonalityTraitsFromSections", () => {
  it("reads tinh_cach_trait_* sections", () => {
    const traits = parsePersonalityTraitsFromSections([
      {
        id: "tinh_cach_trait_ca_tinh",
        title: "Cá tính nổi bật",
        text: "Đoạn một.\n\nĐoạn hai.",
      },
    ]);
    expect(traits).toHaveLength(1);
    expect(traits[0]?.id).toBe("ca_tinh");
    expect(traits[0]?.text).toContain("Đoạn hai");
  });

  it("reads tinh_cach_intro", () => {
    const intro = tinhCachIntroFromSections([
      { id: "tinh_cach_intro", title: "Tổng quan", text: "Mở đầu §02." },
    ]);
    expect(intro).toBe("Mở đầu §02.");
  });
});
