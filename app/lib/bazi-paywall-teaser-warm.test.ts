import { beforeEach, describe, expect, it } from "vitest";

import {
  clearBaziPaywallTeaserLocalAll,
  persistBaziPaywallTeaserCache,
  persistBaziPaywallTeaserLocal,
  persistBaziPaywallTeaserSession,
  readBaziPaywallTeaserCache,
  readBaziPaywallTeaserLocal,
  readBaziPaywallTeaserSession,
} from "~/lib/bazi-reading-session";
import { routeUsesBaziTeaserPrewarm } from "~/lib/route-performance-gates";

describe("routeUsesBaziTeaserPrewarm", () => {
  it("matches /toi hub (legacy gate — prewarm now runs app-wide)", () => {
    expect(routeUsesBaziTeaserPrewarm("/toi")).toBe(true);
    expect(routeUsesBaziTeaserPrewarm("/toi/")).toBe(true);
    expect(routeUsesBaziTeaserPrewarm("/lich")).toBe(false);
    expect(routeUsesBaziTeaserPrewarm("/toi/luan-bat-tu")).toBe(false);
  });
});

describe("bazi paywall teaser session cache", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
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

describe("bazi paywall teaser local cache", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("round-trips via localStorage", () => {
    persistBaziPaywallTeaserLocal("user-1", "rev-a", {
      menhOverview: "Lá số của bạn…",
      laSoDisplay: null,
    });

    expect(readBaziPaywallTeaserLocal("user-1", "rev-a")).toEqual({
      menhOverview: "Lá số của bạn…",
      laSoDisplay: null,
    });
  });

  it("readBaziPaywallTeaserCache prefers session then local", () => {
    persistBaziPaywallTeaserLocal("user-1", "rev-a", {
      menhOverview: "local",
      laSoDisplay: null,
    });
    persistBaziPaywallTeaserSession("user-1", "rev-a", {
      menhOverview: "session",
      laSoDisplay: null,
    });

    expect(readBaziPaywallTeaserCache("user-1", "rev-a")?.menhOverview).toBe(
      "session",
    );

    sessionStorage.clear();
    expect(readBaziPaywallTeaserCache("user-1", "rev-a")?.menhOverview).toBe(
      "local",
    );
  });

  it("clearBaziPaywallTeaserLocalAll removes all profile keys", () => {
    persistBaziPaywallTeaserLocal("user-1", "rev-a", {
      menhOverview: "a",
      laSoDisplay: null,
    });
    persistBaziPaywallTeaserLocal("user-2", "rev-b", {
      menhOverview: "b",
      laSoDisplay: null,
    });
    localStorage.setItem("unrelated-key", "keep");

    clearBaziPaywallTeaserLocalAll();

    expect(readBaziPaywallTeaserLocal("user-1", "rev-a")).toBeNull();
    expect(readBaziPaywallTeaserLocal("user-2", "rev-b")).toBeNull();
    expect(localStorage.getItem("unrelated-key")).toBe("keep");
  });

  it("persistBaziPaywallTeaserCache writes both stores", () => {
    persistBaziPaywallTeaserCache("user-1", "rev-a", {
      menhOverview: "both",
      laSoDisplay: null,
    });

    expect(readBaziPaywallTeaserSession("user-1", "rev-a")?.menhOverview).toBe(
      "both",
    );
    expect(readBaziPaywallTeaserLocal("user-1", "rev-a")?.menhOverview).toBe(
      "both",
    );
  });
});
