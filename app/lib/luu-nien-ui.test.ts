import { describe, expect, it } from "vitest";

import {
  hasLuuNienQuyNhanLuanFromSections,
  luuNienSectionsFromGenerateReading,
  mergeLaSoWithLuuNienSections,
  mergeLuuNienGenerateSections,
  MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS,
} from "./luu-nien-ui";

describe("mergeLaSoWithLuuNienSections", () => {
  it("inserts luu-nien blocks after su_nghiep", () => {
    const laSo = [
      { id: "tinh_cach", title: "Tính cách", text: "A" },
      { id: "su_nghiep", title: "Sự nghiệp", text: "B" },
      { id: "tai_van", title: "Tài vận", text: "C" },
    ];
    const luuNien = [
      { id: "luu_nien_nhin_chung", title: "Nhịp năm", text: "N" },
    ];
    const merged = mergeLaSoWithLuuNienSections(laSo, luuNien);
    expect(merged.map((s) => s.id)).toEqual([
      "tinh_cach",
      "su_nghiep",
      "luu_nien_nhin_chung",
      "tai_van",
    ]);
  });
});

describe("mergeLuuNienGenerateSections", () => {
  it("merges life and core without duplicate ids", () => {
    const merged = mergeLuuNienGenerateSections(
      [{ id: "luu_nien_life_tai_chinh", title: "Tài", text: "L" }],
      [{ id: "ung_xu", title: "Ứng xử", text: "Q" }],
    );
    expect(merged.map((s) => s.id).sort()).toEqual([
      "luu_nien_life_tai_chinh",
      "luu_nien_ung_xu",
    ]);
  });
});

describe("hasLuuNienQuyNhanLuanFromSections", () => {
  it("requires luu_nien_ung_xu at min length", () => {
    expect(
      hasLuuNienQuyNhanLuanFromSections([
        {
          id: "luu_nien_ung_xu",
          title: "Ứng xử",
          text: "z".repeat(MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS),
        },
      ]),
    ).toBe(true);
  });
});

describe("luuNienSectionsFromGenerateReading", () => {
  it("falls back to single van block from reading string", () => {
    const out = luuNienSectionsFromGenerateReading(null, "Vận năm tốt.");
    expect(out).toEqual([
      { id: "luu_nien_van", title: "Vận năm", text: "Vận năm tốt." },
    ]);
  });
});
