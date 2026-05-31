import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  filterLifePayloadToIds,
  mergeLifePayloads,
} from "./luu-nien-life-areas.ts";
import {
  filterTraitPayloadToIds,
  mergeTraitPayloads,
} from "./tinh-cach-traits.ts";

Deno.test("mergeTraitPayloads dedupes by section id", () => {
  const a = {
    intro: "Intro A",
    traits: [
      {
        id: "tinh_cach_trait_diem_manh",
        title: "Điểm mạnh",
        text: "A",
      } as LaSoChiTietSection,
    ],
  };
  const b = {
    intro: null,
    traits: [
      {
        id: "tinh_cach_trait_ca_tinh",
        title: "Cá tính",
        text: "B",
      } as LaSoChiTietSection,
      {
        id: "tinh_cach_trait_diem_manh",
        title: "Điểm mạnh",
        text: "A2",
      } as LaSoChiTietSection,
    ],
  };
  const merged = mergeTraitPayloads(a, b);
  assertEquals(merged?.traits.length, 2);
  assertEquals(merged?.intro, "Intro A");
  assertEquals(
    merged?.traits.find((t) => t.id === "tinh_cach_trait_diem_manh")?.text,
    "A2",
  );
});

Deno.test("filterTraitPayloadToIds drops extra model ids", () => {
  const filtered = filterTraitPayloadToIds(
    {
      intro: null,
      traits: [
        {
          id: "tinh_cach_trait_diem_manh",
          title: "A",
          text: "x",
        },
        {
          id: "tinh_cach_trait_tinh_cam",
          title: "B",
          text: "y",
        },
      ],
    },
    ["diem_manh"],
  );
  assertEquals(filtered?.traits.length, 1);
  assertEquals(filtered?.traits[0]?.id, "tinh_cach_trait_diem_manh");
});

Deno.test("mergeLifePayloads merges year intro from first batch", () => {
  const merged = mergeLifePayloads(
    {
      yearIntro: "Nhịp năm.",
      areas: [
        {
          id: "luu_nien_life_tai_loc",
          title: "Tài lộc",
          text: "x",
        },
      ],
    },
    {
      yearIntro: null,
      areas: [
        {
          id: "luu_nien_life_su_nghiep",
          title: "Sự nghiệp",
          text: "y",
        },
      ],
    },
  );
  assertEquals(merged?.yearIntro, "Nhịp năm.");
  assertEquals(merged?.areas.length, 2);
});

Deno.test("filterLifePayloadToIds keeps only requested areas", () => {
  const filtered = filterLifePayloadToIds(
    {
      yearIntro: "Intro",
      areas: [
        { id: "luu_nien_life_tai_loc", title: "Tài", text: "a" },
        { id: "luu_nien_life_suc_khoe", title: "SK", text: "b" },
      ],
    },
    ["tai_loc"],
  );
  assertEquals(filtered?.areas.length, 1);
  assertEquals(filtered?.areas[0]?.id, "luu_nien_life_tai_loc");
});
