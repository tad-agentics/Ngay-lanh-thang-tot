import { describe, expect, it } from "vitest";

import {
  getActiveTab,
  isSubscriptionExemptPath,
  shouldShowNav,
} from "~/lib/nav-config";

describe("nav-config (Direction C)", () => {
  it("shows BottomNav on 3-tab roots only", () => {
    expect(shouldShowNav("/lich")).toBe(true);
    expect(shouldShowNav("/lich/thang")).toBe(true);
    expect(shouldShowNav("/tra-cuu")).toBe(true);
    expect(shouldShowNav("/tra-cuu/hop-tuoi")).toBe(true);
    expect(shouldShowNav("/toi")).toBe(true);
    expect(shouldShowNav("/tra-cuu/ket-qua")).toBe(false);
    expect(shouldShowNav("/tra-cuu/dang-tim")).toBe(false);
    expect(shouldShowNav("/dat-lich")).toBe(false);
    expect(shouldShowNav("/toi/cai-dat")).toBe(false);
    expect(shouldShowNav("/ngay/2026-05-27")).toBe(false);
  });

  it("maps paths to active tabs", () => {
    expect(getActiveTab("/lich")).toBe("lich");
    expect(getActiveTab("/lich/thang")).toBe("lich");
    expect(getActiveTab("/tra-cuu")).toBe("tra-cuu");
    expect(getActiveTab("/tra-cuu/hop-tuoi")).toBe("tra-cuu");
    expect(getActiveTab("/toi")).toBe("toi");
    expect(getActiveTab("/dat-lich")).toBe(null);
    expect(getActiveTab("/toi/cai-dat")).toBe(null);
  });

  it("exempts renew and addon checkout when subscription expired", () => {
    expect(isSubscriptionExemptPath("/dat-lich")).toBe(true);
    expect(isSubscriptionExemptPath("/thanh-cong")).toBe(true);
    expect(isSubscriptionExemptPath("/luan/mua/xac-nhan")).toBe(true);
    expect(isSubscriptionExemptPath("/luan/mua/thanh-cong")).toBe(true);
    expect(isSubscriptionExemptPath("/toi/cai-dat")).toBe(true);
    expect(isSubscriptionExemptPath("/lich")).toBe(false);
    expect(isSubscriptionExemptPath("/tra-cuu")).toBe(false);
  });
});
