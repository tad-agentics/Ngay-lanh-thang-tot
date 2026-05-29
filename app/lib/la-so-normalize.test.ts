import { describe, expect, it } from "vitest";

import {
  adaptTuTruToLaSoShape,
  isLaSoResponseShape,
  isTuTruResponseShape,
  normalizeLaSoPayload,
} from "./la-so-normalize";
import { laSoJsonToRevealProps } from "./la-so-ui";

describe("la-so-normalize", () => {
  it("detects OpenAPI LaSoResponse pillars", () => {
    expect(
      isLaSoResponseShape({
        birth_date: "1990-01-01",
        pillars: {
          day: { can: { name: "Giáp" }, chi: { name: "Tý" } },
        },
      }),
    ).toBe(true);
  });

  it("adapts TuTruResponse menh to la-so strings", () => {
    const adapted = adaptTuTruToLaSoShape({
      birth_date: "1990-01-01",
      birth_year_can_chi: "Canh Ngọ",
      menh: {
        nap_am_name: "Lộ Bàng Thổ",
        duong_than: "Thổ",
        ky_than: "Mộc",
        hanh: "Thổ",
      },
      element_counts: { Thổ: 3, Mộc: 1 },
    });
    expect(adapted.menh).toBe("Lộ Bàng Thổ");
    expect(adapted.dung_than).toBe("Thổ");
    expect(adapted.ky_than).toBe("Mộc");
    expect(isTuTruResponseShape(adapted)).toBe(true);
  });

  it("maps tu-tru cache through reveal props", () => {
    const props = laSoJsonToRevealProps(
      normalizeLaSoPayload({
        birth_date: "1990-01-01",
        birth_year_can_chi: "Canh Ngọ",
        menh: { nap_am_name: "Lộ Bàng Thổ", duong_than: "Thổ", ky_than: "Mộc" },
      }),
    );
    expect(props?.menh).toBe("Lộ Bàng Thổ");
    expect(props?.dungThan).toBe("Thổ");
    expect(props?.kyThan).toBe("Mộc");
  });
});
