import { afterEach, describe, expect, it, vi } from "vitest";

import {
  INSTALL_BANNER_DISMISSED_KEY,
  dismissInstallBanner,
  isInstallBannerDismissed,
} from "./install-banner-dismiss";

describe("install-banner-dismiss", () => {
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("is not dismissed when no key", () => {
    expect(isInstallBannerDismissed()).toBe(false);
  });

  it("is dismissed within 30 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00Z"));
    dismissInstallBanner();
    expect(isInstallBannerDismissed()).toBe(true);
    vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));
    expect(isInstallBannerDismissed()).toBe(true);
  });

  it("shows again after 30 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00Z"));
    dismissInstallBanner();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));
    expect(isInstallBannerDismissed()).toBe(false);
  });

  it("migrates legacy permanent dismiss to 30-day key", () => {
    localStorage.setItem("ngaytot:install-banner-dismissed", "1");
    expect(isInstallBannerDismissed()).toBe(true);
    expect(localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY)).toBeTruthy();
    expect(localStorage.getItem("ngaytot:install-banner-dismissed")).toBeNull();
  });
});
