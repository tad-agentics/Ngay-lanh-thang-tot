import { describe, expect, it } from "vitest";

import {
  hasTinhCachLuanFromSections,
  mergeLaSoTinhCachSections,
  MIN_TINH_CACH_TRAIT_LUAN_CHARS,
  missingTinhCachTraitIds,
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

describe("hasTinhCachLuanFromSections", () => {
  const traitBody = `a\n\nb\n\n${"x".repeat(MIN_TINH_CACH_TRAIT_LUAN_CHARS)}`;

  it("requires at least two traits with long LLM prose", () => {
    expect(
      hasTinhCachLuanFromSections([
        { id: "tinh_cach_intro", title: "Intro", text: "Chỉ intro." },
        {
          id: "tinh_cach_trait_a",
          title: "A",
          text: traitBody,
        },
      ]),
    ).toBe(false);
    expect(
      hasTinhCachLuanFromSections([
        {
          id: "tinh_cach_trait_a",
          title: "A",
          text: traitBody,
        },
        {
          id: "tinh_cach_trait_b",
          title: "B",
          text: traitBody,
        },
      ]),
    ).toBe(true);
  });
});

describe("missingTinhCachTraitIds", () => {
  const traitBody = `a\n\nb\n\n${"x".repeat(MIN_TINH_CACH_TRAIT_LUAN_CHARS)}`;

  it("returns ids without delivery-length prose", () => {
    const laSo = {
      personality_traits: [
        { id: "diem_manh", title: "Điểm mạnh", text: "gợi ý" },
        { id: "ca_tinh", title: "Cá tính", text: "gợi ý" },
        { id: "can_luu", title: "Lưu ý", text: "gợi ý" },
        { id: "tinh_cam", title: "Tình", text: "gợi ý" },
      ],
    };
    const sections = [
      {
        id: "tinh_cach_trait_diem_manh",
        title: "Điểm mạnh",
        text: traitBody,
      },
      {
        id: "tinh_cach_trait_ca_tinh",
        title: "Cá tính",
        text: traitBody,
      },
    ];
    expect(missingTinhCachTraitIds(laSo, sections).sort()).toEqual([
      "can_luu",
      "tinh_cam",
    ]);
  });
});

describe("mergeLaSoTinhCachSections", () => {
  it("replaces prior §02 sections with supplement", () => {
    const merged = mergeLaSoTinhCachSections(
      [
        { id: "menh_tong_quan", title: "Mệnh", text: "A" },
        { id: "tinh_cach", title: "Cũ", text: "legacy" },
      ],
      [
        { id: "tinh_cach_intro", title: "Intro", text: "Mới." },
        {
          id: "tinh_cach_trait_ca_tinh",
          title: "Cá tính",
          text: "Luận dài.",
        },
      ],
    );
    expect(merged.map((s) => s.id)).toEqual([
      "menh_tong_quan",
      "tinh_cach_intro",
      "tinh_cach_trait_ca_tinh",
    ]);
  });

  it("preserves prior traits when supplement is a partial gap-fill", () => {
    const merged = mergeLaSoTinhCachSections(
      [
        { id: "menh_tong_quan", title: "Mệnh", text: "A" },
        { id: "tinh_cach_intro", title: "Intro", text: "Mở đầu." },
        { id: "tinh_cach_trait_diem_manh", title: "Điểm mạnh", text: "Cũ." },
      ],
      [
        { id: "tinh_cach_trait_can_luu", title: "Lưu ý", text: "Mới." },
        { id: "tinh_cach_trait_tinh_cam", title: "Tình", text: "Mới 2." },
      ],
    );
    expect(merged.map((s) => s.id)).toEqual([
      "menh_tong_quan",
      "tinh_cach_intro",
      "tinh_cach_trait_diem_manh",
      "tinh_cach_trait_can_luu",
      "tinh_cach_trait_tinh_cam",
    ]);
  });

  it("overwrites a trait with same id from supplement", () => {
    const merged = mergeLaSoTinhCachSections(
      [{ id: "tinh_cach_trait_diem_manh", title: "Điểm mạnh", text: "Cũ." }],
      [{ id: "tinh_cach_trait_diem_manh", title: "Điểm mạnh", text: "Mới." }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.text).toBe("Mới.");
  });
});
