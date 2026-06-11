import { describe, expect, it } from "vitest";

import { shouldInvalidateBaziReadingDeliveries } from "./la-so-delivery-invalidation.ts";

describe("shouldInvalidateBaziReadingDeliveries", () => {
  const body = { birth_date: "07/10/2020", birth_time: 10 };

  it("does not invalidate on first persist (no previous la_so)", () => {
    expect(
      shouldInvalidateBaziReadingDeliveries(null, { birth_date: "2020-10-07" }, body),
    ).toBe(false);
  });

  it("invalidates when birth identity changes", () => {
    const old = { birth_date: "1992-06-03", birth_time: 18 };
    const neu = {
      birth_date: "2020-10-07",
      birth_time: 10,
      tu_tru_display: "Canh Tý | Ất Dậu | Quý Mùi | Đinh Tỵ",
    };
    expect(shouldInvalidateBaziReadingDeliveries(old, neu, body)).toBe(true);
  });

  it("invalidates when pillars change but birth matches", () => {
    const old = {
      birth_date: "2020-10-07",
      birth_time: 10,
      tu_tru_display: "Nhâm Thân | Ất Tỵ | Canh Tuất | Ất Dậu",
    };
    const neu = {
      birth_date: "2020-10-07",
      birth_time: 10,
      tu_tru_display: "Canh Tý | Ất Dậu | Quý Mùi | Đinh Tỵ",
    };
    expect(shouldInvalidateBaziReadingDeliveries(old, neu, body)).toBe(true);
  });

  it("keeps delivery when birth and pillars unchanged", () => {
    const laSo = {
      birth_date: "2020-10-07",
      birth_time: 10,
      tu_tru_display: "Canh Tý | Ất Dậu | Quý Mùi | Đinh Tỵ",
    };
    expect(shouldInvalidateBaziReadingDeliveries(laSo, { ...laSo }, body)).toBe(
      false,
    );
  });
});
