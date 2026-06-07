import { describe, expect, it } from "vitest";
import { missingTinhCachTraitIdsFromSections } from "./bazi-reading-trait-ids.ts";

describe("missingTinhCachTraitIdsFromSections", () => {
  it("uses defaults when la_so has no traits", () => {
    expect(missingTinhCachTraitIdsFromSections(null, [])).toEqual([
      "diem_manh",
      "ca_tinh",
      "can_luu",
      "tinh_cam",
    ]);
  });

  it("parses personality_traits from la_so", () => {
    const ids = missingTinhCachTraitIdsFromSections(
      {
        personality_traits: [
          { id: "diem_manh" },
          { id: "ca_tinh" },
        ],
      },
      [],
    );
    expect(ids).toEqual(["diem_manh", "ca_tinh"]);
  });

  it("skips traits with complete section text", () => {
    const longText = "a".repeat(420) + "\n\n" + "b".repeat(420);
    const ids = missingTinhCachTraitIdsFromSections(null, [
      { id: "tinh_cach_trait_diem_manh", text: longText },
    ]);
    expect(ids).not.toContain("diem_manh");
    expect(ids).toContain("ca_tinh");
  });
});
