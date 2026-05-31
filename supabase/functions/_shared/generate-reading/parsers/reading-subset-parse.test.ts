import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  parseTinhCachTraitsResponse,
  tinhCachTraitProseTooShort,
} from "./la-so.ts";
import { parseLuuNienLifeAreasResponse } from "./luu-nien-life.ts";

Deno.test("tinhCachTraitProseTooShort relaxed accepts single long block", () => {
  const body = "Câu mở.\nCâu hai dài hơn mô tả tính cách cụ thể theo lá số.\n".repeat(
    40,
  );
  assertEquals(tinhCachTraitProseTooShort(body, true), false);
});

Deno.test("parseTinhCachTraitsResponse accepts personality_readings relaxed", () => {
  const long = "Đoạn một.\n".repeat(120);
  const raw = JSON.stringify({
    tinh_cach_intro: "Intro đủ dài cho §02 tính cách mở đầu từ lá số.",
    personality_readings: [
      { id: "diem_manh", title: "Điểm mạnh", text: long },
      { id: "ca_tinh", title: "Cá tính", text: long },
    ],
  });
  const parsed = parseTinhCachTraitsResponse(raw, { relaxed: true });
  assertEquals(parsed?.traits.length, 2);
});

Deno.test("parseTinhCachTraitsResponse falls back to sections array", () => {
  const long = "Dòng một đủ dài.\n".repeat(80);
  const raw = JSON.stringify({
    sections: [
      {
        id: "tinh_cach_trait_diem_manh",
        title: "Điểm mạnh",
        text: long,
      },
      {
        id: "tinh_cach_trait_ca_tinh",
        title: "Cá tính",
        text: long,
      },
    ],
  });
  const parsed = parseTinhCachTraitsResponse(raw, { relaxed: true });
  assertEquals(parsed?.traits.length, 2);
  assertEquals(parsed?.traits[0]?.id, "tinh_cach_trait_diem_manh");
});

Deno.test("parseLuuNienLifeAreasResponse falls back to sections array", () => {
  const long = "Nhịp vận năm.\n".repeat(100);
  const raw = JSON.stringify({
    luu_nien_year_intro: "Nhịp năm Bính Ngọ thuận cho bạn trong năm nay.",
    sections: [
      {
        id: "luu_nien_life_tai_loc",
        title: "Tài lộc",
        text: long,
      },
      {
        id: "luu_nien_life_su_nghiep",
        title: "Sự nghiệp",
        text: long,
      },
    ],
  });
  const parsed = parseLuuNienLifeAreasResponse(raw, { relaxed: true });
  assertEquals(parsed?.areas.length, 2);
});
