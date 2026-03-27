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

  it("đại vận active khớp dai_van.current — không mặc định phần tử đầu danh sách", () => {
    const d = laSoJsonToChiTiet({
      dai_van: {
        current: { display: "Giáp Thân", age_range: "31-40" },
      },
      dai_van_list: [
        { label: "Canh Thìn", years: "1-10" },
        { label: "Giáp Thân", years: "31-40" },
        { label: "Ất Dậu", years: "51-60" },
      ],
    });
    const active = d.daiVanList.filter((x) => x.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe("Giáp Thân");
    expect(active[0].years).toBe("31-40");
  });

  it("đọc dai_van_list + current từ lớp data", () => {
    const d = laSoJsonToChiTiet({
      data: {
        dai_van: { current: { display: "Nhâm Ngọ", age_range: "21-30" } },
        dai_van_list: [
          { label: "Tân Tỵ", years: "11-20" },
          { label: "Nhâm Ngọ", years: "21-30" },
        ],
      },
    });
    const active = d.daiVanList.filter((x) => x.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe("Nhâm Ngọ");
  });

  it("reads ngũ hành from nested data + Vietnamese keys", () => {
    const d = laSoJsonToChiTiet({
      data: {
        ngu_hanh: {
          Kim: 10,
          Mộc: 35,
          Thủy: 25,
          Hỏa: 20,
          Thổ: 10,
        },
      },
    });
    expect(d.nguHanh).toEqual({
      kim: 10,
      moc: 35,
      thuy: 25,
      hoa: 20,
      tho: 10,
    });
  });

  it("uses equal 20% placeholder when API omits ngũ hành", () => {
    const d = laSoJsonToChiTiet({
      pillars: {
        day: { can: { name: "Tân" }, chi: { name: "Mùi" } },
      },
    });
    expect(d.nguHanh).toEqual({
      kim: 20,
      moc: 20,
      thuy: 20,
      hoa: 20,
      tho: 20,
    });
  });
});
