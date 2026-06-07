import { describe, expect, it } from "vitest";

import { buildBaziNguHanhBarRows } from "~/lib/bazi-ngu-hanh-display";

describe("buildBaziNguHanhBarRows", () => {
  it("returns five elements in fixed order", () => {
    const rows = buildBaziNguHanhBarRows({ thuy: 40, hoa: 10 });
    expect(rows).toHaveLength(5);
    expect(rows.find((r) => r.key === "thuy")?.v).toBe(40);
    expect(rows.find((r) => r.key === "hoa")?.v).toBe(10);
    expect(rows.find((r) => r.key === "kim")?.v).toBe(0);
  });
});
