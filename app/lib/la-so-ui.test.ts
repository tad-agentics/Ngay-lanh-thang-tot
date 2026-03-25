import { describe, expect, it } from "vitest";

import {
  laSoJsonToChiTiet,
  laSoJsonToRevealProps,
  profileHasLaso,
} from "./la-so-ui";

describe("profileHasLaso", () => {
  it("is false for empty object", () => {
    expect(profileHasLaso({})).toBe(false);
  });

  it("is true for non-empty object", () => {
    expect(profileHasLaso({ nhat_chu: "Giáp" })).toBe(true);
  });
});

describe("laSoJsonToRevealProps", () => {
  it("reads snake_case keys", () => {
    const p = laSoJsonToRevealProps({
      nhat_chu: "Ất",
      nhat_chu_han: "乙",
      hanh: "Mộc",
      menh: "Đại Khê Thủy",
      dung_than: "Hỏa",
      ky_than: "Kim",
      dai_van: "Bính Tuất (2024–2034)",
    });
    expect(p?.nhatChu).toBe("Ất");
    expect(p?.nhatChuHan).toBe("乙");
    expect(p?.dungThan).toBe("Hỏa");
  });

  it("reads tu-tru-api nested objects + pillars", () => {
    const p = laSoJsonToRevealProps({
      status: "success",
      nhat_chu: { can_name: "Tân", hanh: "Kim" },
      menh: { nap_am_name: "Lộ Bàng Thổ", hanh: "Thổ" },
      dung_than: { element: "Thủy", description: "…" },
      ky_than: { element: "Hỏa", description: "…" },
      dai_van: {
        direction: "thuận",
        current: { display: "Bính Tuất", age_range: "32-41" },
      },
      pillars: {
        day: {
          can: { name: "Tân" },
          chi: { name: "Mùi" },
        },
      },
    });
    expect(p?.nhatChu).toBe("Tân");
    expect(p?.nhatChuHan).toBe("Mùi");
    expect(p?.hanh).toBe("Kim");
    expect(p?.menh).toBe("Lộ Bàng Thổ");
    expect(p?.dungThan).toBe("Thủy");
    expect(p?.kyThan).toBe("Hỏa");
    expect(p?.daiVan).toBe("Bính Tuất (32-41)");
  });
});

describe("laSoJsonToChiTiet", () => {
  it("orders pillars Giờ → Ngày → Tháng → Năm for UI columns", () => {
    const d = laSoJsonToChiTiet({
      pillars: {
        year: { can: { name: "Canh" }, chi: { name: "Ngọ" } },
        month: { can: { name: "Nhâm" }, chi: { name: "Ngọ" } },
        day: { can: { name: "Tân" }, chi: { name: "Mùi" } },
        hour: { can: { name: "Quý" }, chi: { name: "Tỵ" } },
      },
    });
    expect(d.thienCan[0]).toBe("Quý");
    expect(d.diaChi[0]).toBe("Tỵ");
    expect(d.thienCan[3]).toBe("Canh");
    expect(d.diaChi[3]).toBe("Ngọ");
  });

  it("reads đại vận cycles from tu-tru-api", () => {
    const d = laSoJsonToChiTiet({
      dai_van: {
        current: { display: "Bính Tuất", age_range: "32-41" },
        cycles: [
          { display: "Quý Mùi", age_range: "2-11" },
          { display: "Bính Tuất", age_range: "32-41" },
        ],
      },
    });
    expect(d.daiVanList.some((x) => x.isActive && x.label === "Bính Tuất")).toBe(
      true,
    );
  });
});
