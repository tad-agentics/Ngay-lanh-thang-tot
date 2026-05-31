import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  laSoTinhCachTraitsRetrySystem,
  laSoTinhCachTraitsSystem,
} from "./la-so.ts";
import {
  luuNienLifeAreasRetrySystem,
  luuNienLifeAreasSystem,
} from "./luu-nien-life.ts";

Deno.test("laSoTinhCachTraitsSystem scopes batch of 2 without four-trait wording", () => {
  const system = laSoTinhCachTraitsSystem({
    traitIds: ["diem_manh", "ca_tinh"],
    includeIntro: false,
  });
  assertStringIncludes(system, "diem_manh, ca_tinh");
  assertStringIncludes(system, "đúng 2");
  assertEquals(system.includes("đúng 4 mục"), false);
  assertStringIncludes(system, "tinh_cach_intro");
  assertStringIncludes(system, "chỉ personality_readings");
});

Deno.test("laSoTinhCachTraitsRetrySystem matches trait count", () => {
  const retry = laSoTinhCachTraitsRetrySystem({
    traitIds: ["can_luu"],
    includeIntro: false,
  });
  assertStringIncludes(retry, "can_luu");
  assertStringIncludes(retry, "1");
  assertEquals(retry.includes("4 mục"), false);
});

Deno.test("luuNienLifeAreasSystem scopes areas", () => {
  const system = luuNienLifeAreasSystem({
    areaIds: ["tai_loc", "su_nghiep"],
    includeIntro: true,
  });
  assertStringIncludes(system, "tai_loc, su_nghiep");
  assertStringIncludes(system, "luu_nien_year_intro");
  assertEquals(system.includes("data.life_areas — không thêm"), false);
});

Deno.test("luuNienLifeAreasRetrySystem matches area count", () => {
  const retry = luuNienLifeAreasRetrySystem({
    areaIds: ["suc_khoe"],
    includeIntro: false,
  });
  assertStringIncludes(retry, "suc_khoe");
  assertEquals(retry.includes("luu_nien_year_intro"), false);
});
