import { beforeEach, describe, expect, it } from "vitest";

import {
  persistBaziPaywallTeaserSession,
  readBaziPaywallTeaserSession,
} from "~/lib/bazi-reading-session";
import { routeUsesBaziTeaserPrewarm } from "~/lib/route-performance-gates";

describe("routeUsesBaziTeaserPrewarm", () => {
  it("matches /toi hub only (not paywall or /lich)", () => {
    expect(routeUsesBaziTeaserPrewarm("/toi")).toBe(true);
    expect(routeUsesBaziTeaserPrewarm("/toi/")).toBe(true);
    expect(routeUsesBaziTeaserPrewarm("/lich")).toBe(false);
    expect(routeUsesBaziTeaserPrewarm("/lich/")).toBe(false);
    expect(routeUsesBaziTeaserPrewarm("/toi/luan-bat-tu")).toBe(false);
    expect(routeUsesBaziTeaserPrewarm("/toi/cai-dat")).toBe(false);
    expect(routeUsesBaziTeaserPrewarm("/")).toBe(false);
  });
});

describe("bazi paywall teaser session cache", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("round-trips menhOverview + laSoDisplay for a matching revision", () => {
    persistBaziPaywallTeaserSession("user-1", "rev-a", {
      menhOverview: "Mệnh tổng quan…",
      laSoDisplay: { ok: true } as never,
    });

    expect(readBaziPaywallTeaserSession("user-1", "rev-a")).toEqual({
      menhOverview: "Mệnh tổng quan…",
      laSoDisplay: { ok: true },
    });
  });

  it("misses when the revision differs (stale birth data / year)", () => {
    persistBaziPaywallTeaserSession("user-1", "rev-a", {
      menhOverview: "Mệnh tổng quan…",
      laSoDisplay: null,
    });

    expect(readBaziPaywallTeaserSession("user-1", "rev-b")).toBeNull();
  });

  it("does not persist an empty teaser (gen failed)", () => {
    persistBaziPaywallTeaserSession("user-1", "rev-a", {
      menhOverview: "",
      laSoDisplay: null,
    });

    expect(readBaziPaywallTeaserSession("user-1", "rev-a")).toBeNull();
  });
});
