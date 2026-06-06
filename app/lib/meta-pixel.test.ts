import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatMetaEventSetupValue,
  META_PIXEL_HEAD_SCRIPT,
  META_PIXEL_ID,
  META_PIXEL_NOSCRIPT_IMG_URL,
  isMetaPixelAllowed,
  resolvePurchaseValueVnd,
  trackMetaInitiateCheckoutOnce,
  trackMetaPurchaseOnce,
} from "~/lib/meta-pixel";

describe("META_PIXEL_HEAD_SCRIPT", () => {
  it("matches Meta install snippet with pixel id", () => {
    expect(META_PIXEL_HEAD_SCRIPT).toContain("fbevents.js");
    expect(META_PIXEL_HEAD_SCRIPT).toContain(`fbq('init', '${META_PIXEL_ID}')`);
    expect(META_PIXEL_HEAD_SCRIPT).toContain("fbq('track', 'PageView')");
    expect(META_PIXEL_NOSCRIPT_IMG_URL).toContain(META_PIXEL_ID);
  });
});

describe("isMetaPixelAllowed", () => {
  beforeEach(() => {
    vi.stubEnv("PROD", true);
  });

  it("is true in production", () => {
    expect(isMetaPixelAllowed()).toBe(true);
  });

  it("is false in development", () => {
    vi.stubEnv("PROD", false);
    expect(isMetaPixelAllowed()).toBe(false);
  });
});

describe("formatMetaEventSetupValue", () => {
  it("returns digits only without locale separators", () => {
    expect(formatMetaEventSetupValue(299_000)).toBe("299000");
    expect(formatMetaEventSetupValue(1_097_000)).toBe("1097000");
  });
});

describe("resolvePurchaseValueVnd", () => {
  it("prefers order amount", () => {
    expect(resolvePurchaseValueVnd(269_100, "goi_1thang")).toBe(269_100);
  });

  it("uses discount breakdown when amount_vnd missing", () => {
    expect(
      resolvePurchaseValueVnd(null, "goi_12thang", {
        discountBreakdown: {
          list_amount_vnd: 799_000,
          amount_vnd: 7_990,
        },
      }),
    ).toBe(7_990);
  });

  it("falls back to catalog price", () => {
    expect(resolvePurchaseValueVnd(null, "luan_bat_tu")).toBe(299_000);
  });
});

describe("trackMetaInitiateCheckoutOnce", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv("PROD", true);
    window.fbq = vi.fn();
  });

  it("fires InitiateCheckout once per sku session", async () => {
    trackMetaInitiateCheckoutOnce({
      packageSku: "goi_1thang",
      valueVnd: 299_000,
      contentName: "3 tháng",
    });
    await Promise.resolve();
    trackMetaInitiateCheckoutOnce({
      packageSku: "goi_1thang",
      valueVnd: 299_000,
      contentName: "3 tháng",
    });
    await Promise.resolve();
    const calls = vi
      .mocked(window.fbq!)
      .mock.calls.filter((c) => c[0] === "track" && c[1] === "InitiateCheckout");
    expect(calls).toHaveLength(1);
  });
});

describe("trackMetaPurchaseOnce", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubEnv("PROD", true);
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
