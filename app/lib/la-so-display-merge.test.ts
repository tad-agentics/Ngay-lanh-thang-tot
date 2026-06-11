import { describe, expect, it } from "vitest";

import type { LaSoJson } from "~/lib/api-types";
import {
  mergeLaSoForProfileDisplay,
  profileLaSoNeedsRecompute,
} from "~/lib/la-so-display-merge";

const profile2020 = {
  ngay_sinh: "2020-10-07",
  gio_sinh: "09:00:00",
  gioi_tinh: "nam" as const,
  la_so: {
    birth_date: "1992-06-03",
    birth_time: 18,
    pillars: {
      year: { can: { name: "Nhâm" }, chi: { name: "Thân" } },
    },
  },
};

describe("profileLaSoNeedsRecompute", () => {
  it("true when la_so birth differs from profile", () => {
    expect(profileLaSoNeedsRecompute(profile2020)).toBe(true);
  });

  it("false when identity matches", () => {
    expect(
      profileLaSoNeedsRecompute({
        ...profile2020,
        la_so: { birth_date: "2020-10-07", birth_time: 10 },
      }),
    ).toBe(false);
  });
});

describe("mergeLaSoForProfileDisplay", () => {
  it("uses API enrichment when stored la_so is stale", () => {
    const enrichment = {
      birth_date: "2020-10-07",
      birth_time: 10,
      pillars: {
        year: { can: { name: "Canh" }, chi: { name: "Tý" } },
      },
    };
    const out = mergeLaSoForProfileDisplay(profile2020, enrichment);
    const pillars = (out as Record<string, unknown>).pillars as Record<
      string,
      { can: { name: string } }
    >;
    expect(pillars.year.can.name).toBe("Canh");
  });

  it("does not stale-fallback by default", () => {
    const out = mergeLaSoForProfileDisplay(profile2020, null);
    expect(out).toBeNull();
  });

  it("allowStaleFallback when API failed", () => {
    const out = mergeLaSoForProfileDisplay(profile2020, null, {
      allowStaleFallback: true,
    });
    expect(out).toEqual(profile2020.la_so as LaSoJson);
  });
});
