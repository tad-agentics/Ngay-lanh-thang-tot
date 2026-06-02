import { describe, expect, it } from "vitest";

import {
  listMissingVanTrinhWaves,
  vanTrinhNamDeliveryIsComplete,
} from "~/lib/van-trinh-nam-delivery-complete";
import type { VanTrinhSectionSlice } from "~/lib/van-trinh-nam-delivery-complete";
import { parseVanTrinhNamLuanContext } from "~/lib/van-trinh-nam-parse";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__/van-trinh-nam-luan-context-2026.json",
);

function long(text: string, n: number): string {
  return text.repeat(Math.ceil(n / text.length)).slice(0, n);
}

describe("vanTrinhNamDeliveryIsComplete", () => {
  it("is false without sections", () => {
    const ctx = parseVanTrinhNamLuanContext(
      JSON.parse(readFileSync(fixturePath, "utf8")),
    )!;
    expect(vanTrinhNamDeliveryIsComplete([], ctx)).toBe(false);
  });

  it("is true with all required section ids", () => {
    const ctx = parseVanTrinhNamLuanContext(
      JSON.parse(readFileSync(fixturePath, "utf8")),
    )!;
    const sections: VanTrinhSectionSlice[] = [
      { id: "a1_hook", text: long("a", 90) },
      { id: "a2_you", text: long("b", 90) },
      { id: "a3_su_nghiep", text: long("c", 70) },
      { id: "a3_tai_loc", text: long("d", 70) },
      { id: "a3_tinh_cam", text: long("e", 70) },
      { id: "a3_suc_khoe", text: long("f", 70) },
      { id: "c_closing", text: long("g", 90) },
      ...Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return [
          { id: `b${m}_theme`, text: long("t", 50) },
          { id: `b${m}_emphasis`, text: long("e", 50) },
          { id: `b${m}_actions`, text: long("x", 40) },
        ];
      }).flat(),
    ];
    expect(vanTrinhNamDeliveryIsComplete(sections, ctx)).toBe(true);
    expect(listMissingVanTrinhWaves(sections, ctx)).toHaveLength(0);
  });

  it("lists missing month wave", () => {
    const ctx = parseVanTrinhNamLuanContext(
      JSON.parse(readFileSync(fixturePath, "utf8")),
    )!;
    const missing = listMissingVanTrinhWaves([], ctx);
    expect(missing.some((t) => t.kind === "part_a")).toBe(true);
    expect(missing.some((t) => t.kind === "month" && t.monthNum === 1)).toBe(
      true,
    );
  });
});
