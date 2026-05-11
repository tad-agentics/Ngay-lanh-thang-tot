import { describe, expect, it } from "vitest";

import { getActiveTab, shouldShowNav } from "~/lib/nav-config";

describe("nav-config", () => {
  it("shows BottomNav on tab roots, chọn ngày flow, and lookup stack routes", () => {
    expect(shouldShowNav("/app")).toBe(true);
    expect(shouldShowNav("/app/chon-ngay")).toBe(true);
    expect(shouldShowNav("/app/chon-ngay/ket-qua")).toBe(true);
    expect(shouldShowNav("/app/thang")).toBe(true);
    expect(shouldShowNav("/app/tra-cuu")).toBe(true);
    expect(shouldShowNav("/app/toi")).toBe(true);
    expect(shouldShowNav("/app/hop-tuoi")).toBe(true);
    expect(shouldShowNav("/app/phong-thuy")).toBe(true);
    expect(shouldShowNav("/app/van-thang")).toBe(true);
    expect(shouldShowNav("/app/la-so")).toBe(true);
    expect(shouldShowNav("/app/la-so/chi-tiet")).toBe(true);
    expect(shouldShowNav("/app/cai-dat")).toBe(false);
    expect(shouldShowNav("/app/mua-luong")).toBe(false);
    expect(shouldShowNav("/app/bat-dau")).toBe(false);
  });

  it("maps paths to active tabs", () => {
    expect(getActiveTab("/app")).toBe("home");
    expect(getActiveTab("/app/thang")).toBe("month");
    expect(getActiveTab("/app/chon-ngay")).toBe(null);
    expect(getActiveTab("/app/chon-ngay/ket-qua")).toBe(null);
    expect(getActiveTab("/app/tra-cuu")).toBe("lookup");
    expect(getActiveTab("/app/toi")).toBe("me");
    expect(getActiveTab("/app/cai-dat")).toBe(null);
    expect(getActiveTab("/app/van-thang")).toBe("lookup");
    expect(getActiveTab("/app/hop-tuoi")).toBe("lookup");
    expect(getActiveTab("/app/phong-thuy")).toBe("lookup");
    expect(getActiveTab("/app/la-so")).toBe("lookup");
    expect(getActiveTab("/app/la-so/chi-tiet")).toBe("lookup");
  });
});
