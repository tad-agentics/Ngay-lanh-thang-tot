import { describe, expect, it } from "vitest";

import {
  laSoPillarFingerprint,
  laSoPillarsMatch,
} from "./la-so-pillar-identity.ts";

describe("la-so-pillar-identity", () => {
  it("reads tu_tru_display fingerprint", () => {
    expect(
      laSoPillarFingerprint({
        tu_tru_display: "Canh Tý | Ất Dậu | Quý Mùi | Đinh Tỵ",
      }),
    ).toBe("Canh Tý | Ất Dậu | Quý Mùi | Đinh Tỵ");
  });

  it("builds fingerprint from pillars", () => {
    expect(
      laSoPillarFingerprint({
        pillars: {
          year: { can: { name: "Canh" }, chi: { name: "Tý" } },
          month: { can: { name: "Ất" }, chi: { name: "Dậu" } },
          day: { can: { name: "Quý" }, chi: { name: "Mùi" } },
          hour: { can: { name: "Đinh" }, chi: { name: "Tỵ" } },
        },
      }),
    ).toBe("Canh Tý | Ất Dậu | Quý Mùi | Đinh Tỵ");
  });

  it("detects stale pillar cache", () => {
    const correct = { tu_tru_display: "Canh Tý | Ất Dậu | Quý Mùi | Đinh Tỵ" };
    const wrong = { tu_tru_display: "Nhâm Thân | Ất Tỵ | Canh Tuất | Ất Dậu" };
    expect(laSoPillarsMatch(correct, wrong)).toBe(false);
    expect(laSoPillarsMatch(correct, correct)).toBe(true);
  });

  it("rejects when only one side has fingerprint", () => {
    const withDisplay = { tu_tru_display: "Canh Tý | Ất Dậu | Quý Mùi | Đinh Tỵ" };
    expect(laSoPillarsMatch(withDisplay, { birth_date: "2020-10-07" })).toBe(
      false,
    );
  });
});
