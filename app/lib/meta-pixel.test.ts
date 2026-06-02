import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MARKETING_CONSENT_STORAGE_KEY,
  writeMarketingConsent,
} from "~/lib/meta-pixel-consent";
import {
  isMetaPixelAllowed,
  resolvePurchaseValueVnd,
  trackMetaPurchaseOnce,
} from "~/lib/meta-pixel";

describe("isMetaPixelAllowed", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv("PROD", true);
  });

  it("is false without consent", () => {
    expect(isMetaPixelAllowed()).toBe(false);
  });

  it("is true when consent granted in production", () => {
    writeMarketingConsent("granted");
    expect(isMetaPixelAllowed()).toBe(true);
  });

  it("is false when consent denied", () => {
    writeMarketingConsent("denied");
    expect(isMetaPixelAllowed()).toBe(false);
    expect(localStorage.getItem(MARKETING_CONSENT_STORAGE_KEY)).toBe("denied");
  });
});

describe("resolvePurchaseValueVnd", () => {
  it("prefers order amount", () => {
    expect(resolvePurchaseValueVnd(269_100, "goi_1thang")).toBe(269_100);
  });

  it("falls back to catalog price", () => {
    expect(resolvePurchaseValueVnd(null, "luan_bat_tu")).toBe(299_000);
  });
});

describe("trackMetaPurchaseOnce", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubEnv("PROD", true);
    writeMarketingConsent("granted");
    window.fbq = vi.fn();
  });

  it("dedupes by order id", async () => {
    trackMetaPurchaseOnce({
      orderId: "order-1",
      valueVnd: 299_000,
      contentIds: ["luan_bat_tu"],
    });
    await Promise.resolve();
    trackMetaPurchaseOnce({
      orderId: "order-1",
      valueVnd: 299_000,
      contentIds: ["luan_bat_tu"],
    });
    await Promise.resolve();
    const purchaseCalls = vi
      .mocked(window.fbq!)
      .mock.calls.filter((c) => c[0] === "track" && c[1] === "Purchase");
    expect(purchaseCalls).toHaveLength(1);
    expect(window.fbq).toHaveBeenCalledWith("track", "Purchase", {
      value: 299_000,
      currency: "VND",
      content_name: undefined,
      content_ids: ["luan_bat_tu"],
      content_type: "product",
    });
  });
});
