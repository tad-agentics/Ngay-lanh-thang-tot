import { describe, expect, it } from "vitest";

import { getActiveTab, shouldShowNav } from "~/lib/nav-config";

describe("nav-config", () => {
  it("shows BottomNav only on calendar, chọn ngày, settings roots", () => {
    expect(shouldShowNav("/app")).toBe(true);
    expect(shouldShowNav("/app/chon-ngay")).toBe(true);
    expect(shouldShowNav("/app/chon-ngay/ket-qua")).toBe(true);
    expect(shouldShowNav("/app/cai-dat")).toBe(true);
    expect(shouldShowNav("/app/mua-luong")).toBe(false);
    expect(shouldShowNav("/app/bat-dau")).toBe(false);
    expect(shouldShowNav("/app/la-so")).toBe(false);
  });

  it("maps paths to active tabs", () => {
    expect(getActiveTab("/app")).toBe("lich");
    expect(getActiveTab("/app/chon-ngay/ket-qua")).toBe("chon-ngay");
    expect(getActiveTab("/app/cai-dat")).toBe("cai-dat");
    expect(getActiveTab("/app/van-thang")).toBe("kham-pha");
  });
});
