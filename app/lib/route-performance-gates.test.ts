import { describe, expect, it } from "vitest";

import { routeUsesSavedPicks } from "~/lib/route-performance-gates";

describe("routeUsesSavedPicks", () => {
  it("includes /lich for inline day marks", () => {
    expect(routeUsesSavedPicks("/lich")).toBe(true);
    expect(routeUsesSavedPicks("/lich/thang")).toBe(true);
  });

  it("still includes /toi and /ngay", () => {
    expect(routeUsesSavedPicks("/toi")).toBe(true);
    expect(routeUsesSavedPicks("/ngay/2026-06-15")).toBe(true);
  });

  it("excludes unrelated routes", () => {
    expect(routeUsesSavedPicks("/tra-cuu")).toBe(false);
  });
});
