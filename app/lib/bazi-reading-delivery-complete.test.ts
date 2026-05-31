import { describe, expect, it } from "vitest";

import { baziReadingDeliveryIsComplete } from "./bazi-reading-load";
import { MIN_MENH_TONG_QUAN_LUAN_CHARS } from "./bazi-reading-outline";
import { LUU_NIEN_LIFE_AREA_PREFIX } from "./luu-nien-life-ui";
import { MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS } from "./luu-nien-ui";

const menhText = "m".repeat(MIN_MENH_TONG_QUAN_LUAN_CHARS);
const traitText = "x".repeat(1500);
const lifeText = "y".repeat(2500);
const quyText = "z".repeat(MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS);
const phongText = "p".repeat(80);

function fullSections(): {
  id: string;
  title: string;
  text: string;
}[] {
  return [
    { id: "menh_tong_quan", title: "Mệnh", text: menhText },
    {
      id: "tinh_cach_trait_1",
      title: "T1",
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
    { id: "phong_thuy_van", title: "PT", text: phongText },
  ];
}

describe("baziReadingDeliveryIsComplete", () => {
  const luuFacts = {
    lifeAreas: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
    quyNhan: { tuoiHop: ["30"] },
    daiVanNext: null,
  };
  const phongFacts = { huong_tot: ["Đông"] };

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

  it("requires phong prose when phong facts were fetched", () => {
    const sections = fullSections().filter((s) => !s.id.startsWith("phong_thuy_"));
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
