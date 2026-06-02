import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  deriveVanTrinhNamMonthChartValues,
  parseVanTrinhNamLuanContext,
  validateVanTrinhNamMonths,
} from "~/lib/van-trinh-nam-parse";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__/van-trinh-nam-luan-context-2026.json",
);

describe("parseVanTrinhNamLuanContext", () => {
  it("parses fixture with 12 months", () => {
    const raw = JSON.parse(readFileSync(fixturePath, "utf8"));
    const ctx = parseVanTrinhNamLuanContext(raw);
    expect(ctx).not.toBeNull();
    expect(validateVanTrinhNamMonths(ctx!)).toBe(true);
    expect(ctx!.part_a.four_aspects_year.length).toBe(4);
  });

  it("derives chart values", () => {
    const raw = JSON.parse(readFileSync(fixturePath, "utf8"));
    const ctx = parseVanTrinhNamLuanContext(raw)!;
    const values = deriveVanTrinhNamMonthChartValues(ctx.part_b.luu_nguyet_months);
    expect(values).toHaveLength(12);
    expect(values.every((v) => v >= 0 && v <= 100)).toBe(true);
  });
});
