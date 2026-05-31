import { describe, expect, it } from "vitest";

import { baziReadingDeliveryIsComplete } from "./bazi-reading-load";
import { MIN_MENH_TONG_QUAN_LUAN_CHARS } from "./bazi-reading-outline";
import { LUU_NIEN_LIFE_AREA_PREFIX } from "./luu-nien-life-ui";
import { MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS } from "./luu-nien-ui";
import {
  PHONG_THUY_HUONG_SECTION_ID,
  PHONG_THUY_MAU_SECTION_ID,
  PHONG_THUY_PHI_TINH_SECTION_ID,
} from "./phong-thuy-ui";

const menhText = "m".repeat(MIN_MENH_TONG_QUAN_LUAN_CHARS);
const traitText = `a\n\nb\n\n${"x".repeat(420)}`;
const lifeText = `a\n\nb\n\n${"y".repeat(420)}`;
const quyText = `a\n\nb\n\nc\n\nd\n\n${"z".repeat(MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS)}`;

function phongSections(): { id: string; title: string; text: string }[] {
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
      text: `a\n\nb\n\nc\n\nd\n\n${"p".repeat(560)}`,
    },
  ];
}

function fullSections(): {
  id: string;
  title: string;
  text: string;
}[] {
  return [
    { id: "menh_tong_quan", title: "Mệnh", text: menhText },
    {
      id: "tinh_cach_trait_diem_manh",
      title: "Điểm mạnh",
      text: traitText,
    },
    {
      id: "tinh_cach_trait_ca_tinh",
      title: "Cá tính",
      text: traitText,
    },
    {
      id: `${LUU_NIEN_LIFE_AREA_PREFIX}a`,
      title: "A",
      text: lifeText,
    },
    {
      id: `${LUU_NIEN_LIFE_AREA_PREFIX}b`,
      title: "B",
      text: lifeText,
    },
    {
      id: `${LUU_NIEN_LIFE_AREA_PREFIX}c`,
      title: "C",
      text: lifeText,
    },
    {
      id: `${LUU_NIEN_LIFE_AREA_PREFIX}d`,
      title: "D",
      text: lifeText,
    },
    { id: "luu_nien_ung_xu", title: "Ứng xử", text: quyText },
    ...phongSections(),
  ];
}

describe("baziReadingDeliveryIsComplete", () => {
  const luuFacts = {
    lifeAreas: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
    quyNhan: { tuoiHop: ["30"] },
    daiVanNext: null,
  };
  const phongFacts = {
    huong_tot_nam_nay: ["Đông Nam"],
    mau_may_man: ["Đỏ"],
    phi_tinh: [{ direction: "Đông", star: "Tứ Lục", tone: "good" }],
  };

  it("returns true when all five chapters have LLM prose", () => {
    expect(
      baziReadingDeliveryIsComplete(fullSections(), {
        luuNienFactsRaw: luuFacts,
        phongThuyFactsRaw: phongFacts,
      }),
    ).toBe(true);
  });

  it("requires quy prose when API sent quyNhan facts", () => {
    const sections = fullSections().filter((s) => s.id !== "luu_nien_ung_xu");
    expect(
      baziReadingDeliveryIsComplete(sections, {
        luuNienFactsRaw: luuFacts,
        phongThuyFactsRaw: phongFacts,
      }),
    ).toBe(false);
  });

  it("requires all phong blocks when phong facts were fetched", () => {
    const sections = fullSections().filter(
      (s) => s.id !== PHONG_THUY_PHI_TINH_SECTION_ID,
    );
    expect(
      baziReadingDeliveryIsComplete(sections, {
        luuNienFactsRaw: luuFacts,
        phongThuyFactsRaw: phongFacts,
      }),
    ).toBe(false);
  });

  it("skips phong check when phong facts fetch failed (null)", () => {
    const sections = fullSections().filter((s) => !s.id.startsWith("phong_thuy_"));
    expect(
      baziReadingDeliveryIsComplete(sections, {
        luuNienFactsRaw: luuFacts,
        phongThuyFactsRaw: null,
      }),
    ).toBe(true);
  });
});
