import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  clearUserReadingSessionCaches,
  LA_SO_RECOMPUTED_EVENT,
} from "~/lib/la-so-recompute-invalidate";

describe("clearUserReadingSessionCaches", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("removes ngaytot session keys for the user", () => {
    sessionStorage.setItem("ngaytot_today_home:u1:2026-05-27", "{}");
    sessionStorage.setItem("ngaytot_today_ai_reading:u1:2026-05-27", "text");
    sessionStorage.setItem("bazi-reading-ai:u1", "{}");
    sessionStorage.setItem("ngaytot_today_home:u2:2026-05-27", "{}");

    clearUserReadingSessionCaches("u1");

    expect(sessionStorage.getItem("ngaytot_today_home:u1:2026-05-27")).toBeNull();
    expect(sessionStorage.getItem("ngaytot_today_ai_reading:u1:2026-05-27")).toBeNull();
    expect(sessionStorage.getItem("bazi-reading-ai:u1")).toBeNull();
    expect(sessionStorage.getItem("ngaytot_today_home:u2:2026-05-27")).not.toBeNull();
  });
});

describe("LA_SO_RECOMPUTED_EVENT", () => {
  it("is a stable event name", () => {
    expect(LA_SO_RECOMPUTED_EVENT).toBe("ngaytot:la-so-recomputed");
  });
});

describe("invalidateLaSoRecomputeCaches", () => {
  it("dispatches profile refresh and recompute events", async () => {
    const { invalidateLaSoRecomputeCaches } = await import(
      "~/lib/la-so-recompute-invalidate"
    );
    const refresh = vi.fn();
    const recomputed = vi.fn();
    window.addEventListener("ngaytot:profile-refresh", refresh);
    window.addEventListener(LA_SO_RECOMPUTED_EVENT, recomputed);

    invalidateLaSoRecomputeCaches("u1");

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(recomputed).toHaveBeenCalledTimes(1);

    window.removeEventListener("ngaytot:profile-refresh", refresh);
    window.removeEventListener(LA_SO_RECOMPUTED_EVENT, recomputed);
  });
});
