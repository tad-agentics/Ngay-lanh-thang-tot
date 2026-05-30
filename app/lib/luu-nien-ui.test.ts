import { describe, expect, it } from "vitest";

import {
  luuNienSectionsFromGenerateReading,
  mergeLaSoWithLuuNienSections,
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

describe("luuNienSectionsFromGenerateReading", () => {
  it("falls back to single van block from reading string", () => {
    const out = luuNienSectionsFromGenerateReading(null, "Vận năm tốt.");
    expect(out).toEqual([
      { id: "luu_nien_van", title: "Vận năm", text: "Vận năm tốt." },
    ]);
  });
});
