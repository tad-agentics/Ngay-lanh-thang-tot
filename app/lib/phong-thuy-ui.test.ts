import { describe, expect, it } from "vitest";

import { deriveChapterLoadState } from "./bazi-chapter-load";
import type { PhongThuyFactsView } from "~/lib/phong-thuy-facts-ui";
import {
  hasPhongThuyLuanFromSections,
  PHONG_THUY_HUONG_SECTION_ID,
  PHONG_THUY_MAU_SECTION_ID,
  PHONG_THUY_PHI_TINH_SECTION_ID,
  phongThuyHuongLuanFromSections,
  phongThuySectionsFromGenerateReading,
} from "./phong-thuy-ui";

const facts: PhongThuyFactsView = {
  huongTot: [{ name: "Đông Nam", sub: "", highlight: true }],
  huongXau: ["Tây"],
  mauMay: [{ name: "Đỏ", hex: "#c00" }],
  mauKy: [],
  phiTinh: [
  {
    direction: "Đông",
    star: "Tứ Lục",
    tone: "good",
  },
  ],
  phiTinhNote: "Ghi chú API",
};

describe("hasPhongThuyLuanFromSections", () => {
  it("requires all three blocks when facts present", () => {
    const sections = [
      {
        id: PHONG_THUY_HUONG_SECTION_ID,
        title: "H",
        text: "h".repeat(420),
      },
      {
        id: PHONG_THUY_MAU_SECTION_ID,
        title: "M",
        text: "m".repeat(420),
      },
      {
        id: PHONG_THUY_PHI_TINH_SECTION_ID,
        title: "P",
        text: `a\n\nb\n\nc\n\nd\n\n${"p".repeat(560)}`,
      },
    ];
    expect(hasPhongThuyLuanFromSections(sections, facts)).toBe(true);
    expect(phongThuyHuongLuanFromSections(sections).length).toBeGreaterThanOrEqual(420);
  });

  it("accepts legacy phong_thuy_van", () => {
    expect(
      hasPhongThuyLuanFromSections(
        [{ id: "phong_thuy_van", title: "PT", text: "x".repeat(80) }],
        facts,
      ),
    ).toBe(true);
  });

  it("returns false when huong block missing", () => {
    const sections = [
      {
        id: PHONG_THUY_MAU_SECTION_ID,
        title: "M",
        text: "m".repeat(420),
      },
      {
        id: PHONG_THUY_PHI_TINH_SECTION_ID,
        title: "P",
        text: `a\n\nb\n\nc\n\nd\n\n${"p".repeat(560)}`,
      },
    ];
    expect(hasPhongThuyLuanFromSections(sections, facts)).toBe(false);
  });
});

function fullPhongThuySections(): {
  id: string;
  title: string;
  text: string;
}[] {
  return [
    {
      id: PHONG_THUY_HUONG_SECTION_ID,
      title: "H",
      text: "h".repeat(420),
    },
    {
      id: PHONG_THUY_MAU_SECTION_ID,
      title: "M",
      text: "m".repeat(420),
    },
    {
      id: PHONG_THUY_PHI_TINH_SECTION_ID,
      title: "P",
      text: `a\n\nb\n\nc\n\n${"p".repeat(560)}`,
    },
  ];
}

describe("deriveChapterLoadState (phong_thuy)", () => {
  it("keeps §04 loading while only one block has LLM prose", () => {
    const load = deriveChapterLoadState(
      [
        {
          id: PHONG_THUY_HUONG_SECTION_ID,
          title: "H",
          text: "h".repeat(420),
        },
      ],
      {
        phongThuyFactsRaw: facts,
        bundleFinished: false,
      },
    );
    expect(load.phong_thuy).toBe("loading");
    expect(hasPhongThuyLuanFromSections(
      [{ id: PHONG_THUY_HUONG_SECTION_ID, title: "H", text: "h".repeat(420) }],
      facts,
    )).toBe(false);
  });

  it("marks §04 failed when bundle ends without all blocks", () => {
    const load = deriveChapterLoadState(
      [
        {
          id: PHONG_THUY_HUONG_SECTION_ID,
          title: "H",
          text: "h".repeat(420),
        },
      ],
      {
        phongThuyFactsRaw: facts,
        bundleFinished: true,
      },
    );
    expect(load.phong_thuy).toBe("failed");
  });

  it("marks §04 done when all three blocks meet length gates", () => {
    const sections = fullPhongThuySections();
    const load = deriveChapterLoadState(sections, {
      phongThuyFactsRaw: facts,
      bundleFinished: true,
    });
    expect(load.phong_thuy).toBe("done");
    expect(hasPhongThuyLuanFromSections(sections, facts)).toBe(true);
  });
});

describe("phongThuySectionsFromGenerateReading", () => {
  it("prefers structured sections from Edge", () => {
    const out = phongThuySectionsFromGenerateReading(
      null,
      [{ id: "phong_thuy_huong", title: "H", text: "Luận hướng." }],
      null,
    );
    expect(out[0]?.id).toBe("phong_thuy_huong");
  });
});
