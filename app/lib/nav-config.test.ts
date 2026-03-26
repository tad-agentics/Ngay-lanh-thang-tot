import { describe, expect, it } from "vitest";

import { getActiveTab, shouldShowNav } from "~/lib/nav-config";

describe("nav-config", () => {
  it("shows BottomNav on tab roots, chọn ngày flow, khám phá màn chọn", () => {
    expect(shouldShowNav("/app")).toBe(true);
    expect(shouldShowNav("/app/chon-ngay")).toBe(true);
    expect(shouldShowNav("/app/chon-ngay/ket-qua")).toBe(true);
    expect(shouldShowNav("/app/cai-dat")).toBe(true);
    expect(shouldShowNav("/app/hop-tuoi")).toBe(true);
    expect(shouldShowNav("/app/phong-thuy")).toBe(true);
    expect(shouldShowNav("/app/van-thang")).toBe(true);
    expect(shouldShowNav("/app/la-so")).toBe(true);
    expect(shouldShowNav("/app/la-so/chi-tiet")).toBe(true);
    expect(shouldShowNav("/app/mua-luong")).toBe(false);
    expect(shouldShowNav("/app/bat-dau")).toBe(false);
  });

  it("maps paths to active tabs", () => {
    expect(getActiveTab("/app")).toBe("lich");
    expect(getActiveTab("/app/chon-ngay/ket-qua")).toBe("chon-ngay");
    expect(getActiveTab("/app/cai-dat")).toBe("cai-dat");
    expect(getActiveTab("/app/van-thang")).toBe("kham-pha");
    expect(getActiveTab("/app/hop-tuoi")).toBe("kham-pha");
    expect(getActiveTab("/app/phong-thuy")).toBe("kham-pha");
    expect(getActiveTab("/app/la-so")).toBe("kham-pha");
    expect(getActiveTab("/app/la-so/chi-tiet")).toBe("kham-pha");
  });
});
