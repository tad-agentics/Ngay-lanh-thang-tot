import { describe, expect, it } from "vitest";

import type { LaSoJson } from "./api-types";
import {
  buildLaSoFullPillarRows,
  buildLaSoNlttTeaser,
  extractHourPillarPreview,
  extractLaSoChiTietEnrichment,
  extractMenhMoTa,
  laSoJsonToChiTiet,
  laSoJsonToRevealProps,
  mergeLaSoJsonForChiTietDisplay,
  profileHasLaso,
  thanColorsHintVi,
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

  it("reads dai_van_current (GET /v1/la-so)", () => {
    const p = laSoJsonToRevealProps({
      dai_van_current: {
        display: "Ất Dậu",
        hanh: "Mộc",
        age_range: "28-37",
      },
    });
    expect(p?.daiVan).toBe("Ất Dậu (28-37)");
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

  it("GET /v1/la-so: đọc dai_van_current (một dòng đại vận, không cycles)", () => {
    const d = laSoJsonToChiTiet({
      status: "success",
      dai_van_current: {
        display: "Ất Dậu",
        hanh: "Mộc",
        nap_am_hanh: "Thủy",
        age_range: "28-37",
      },
    });
    expect(d.daiVanList).toEqual([
      { label: "Ất Dậu", years: "28-37", isActive: true },
    ]);
  });

  it("ưu tiên tuổi mụ / start_end từ current khi khác dai_van_list", () => {
    const d = laSoJsonToChiTiet({
      dai_van: {
        current: {
          display: "Quý Mùi",
          age_range: "31-40",
          age_range_lunar: "35-44",
        },
      },
      dai_van_list: [
        { label: "Ất Tỵ", years: "21-30" },
        { label: "Quý Mùi", years: "31-40" },
      ],
    });
    const active = d.daiVanList.filter((x) => x.isActive);
    expect(active).toHaveLength(1);
    expect(active[0]!.label).toBe("Quý Mùi");
    expect(active[0]!.years).toBe("35-44");
  });

  it("gộp dai_van_current — active hiển thị tuổi mụ thay vì chu kỳ list", () => {
    const d = laSoJsonToChiTiet({
      dai_van: {
        current: { display: "Quý Mùi", age_range: "31-40" },
      },
      dai_van_current: {
        display: "Quý Mùi",
        age_range_muc: "36-45",
      },
      dai_van_list: [
        { label: "Canh Thìn", years: "1-10" },
        { label: "Tân Tỵ", years: "11-20" },
        { label: "Nhâm Ngọ", years: "21-30" },
        { label: "Quý Mùi", years: "31-40" },
      ],
    });
    const active = d.daiVanList.find((x) => x.isActive);
    expect(active?.label).toBe("Quý Mùi");
    expect(active?.years).toBe("36-45");
    const quy = d.daiVanList.find((x) => x.label === "Quý Mùi");
    expect(quy?.isActive).toBe(true);
  });

  it("đọc khoảng tuổi từ start_age / end_age", () => {
    const d = laSoJsonToChiTiet({
      dai_van: {
        current: {
          display: "Quý Mùi",
          start_age: 35,
          end_age: 44,
          age_range: "31-40",
        },
      },
      dai_van_list: [{ label: "Quý Mùi", years: "31-40" }],
    });
    const active = d.daiVanList.find((x) => x.isActive);
    expect(active?.years).toBe("35-44");
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

  it("reads _raw.element_counts (trọng số engine) → phần trăm theo tổng", () => {
    const d = laSoJsonToChiTiet({
      _raw: {
        element_counts: {
          Kim: 4.4,
          Mộc: 0.6,
          Thủy: 2,
          Hỏa: 2,
          Thổ: 1,
        },
      },
    });
    const sum =
      d.nguHanh.kim +
      d.nguHanh.moc +
      d.nguHanh.thuy +
      d.nguHanh.hoa +
      d.nguHanh.tho;
    expect(sum).toBeCloseTo(100, 5);
    expect(d.nguHanh.kim).toBeCloseTo(44, 5);
    expect(d.nguHanh.moc).toBeCloseTo(6, 5);
  });

  it("elementCounts camelCase trên _raw (API)", () => {
    const d = laSoJsonToChiTiet({
      _raw: { elementCounts: { Kim: 2, Mộc: 2, Thủy: 2, Hỏa: 2, Thổ: 2 } },
    });
    expect(d.nguHanh.kim).toBeCloseTo(20, 5);
  });

  it("extractLaSoChiTietEnrichment: camelCase + lồng payload", () => {
    const ext = extractLaSoChiTietEnrichment({
      payload: { _raw: { elementCounts: { Kim: 9, Mộc: 1 } } },
    });
    expect(ext).toEqual({
      _raw: { element_counts: { Kim: 9, Mộc: 1 } },
    });
  });

  it("element_counts trong data._raw (shape la-so đầy đủ)", () => {
    const d = laSoJsonToChiTiet({
      data: {
        _raw: {
          element_counts: { Kim: 50, Mộc: 10, Thủy: 10, Hỏa: 15, Thổ: 15 },
        },
      },
    });
    expect(d.nguHanh.kim).toBe(50);
    expect(d.nguHanh.tho).toBe(15);
  });

  it("mergeLaSoJsonForChiTietDisplay gộp sâu _raw, không ghi đè field khác", () => {
    const merged = mergeLaSoJsonForChiTietDisplay(
      {
        _raw: { support_ratio: 0.4, element_counts: { Kim: 1, Mộc: 1 } },
      } as LaSoJson,
      {
        _raw: { element_counts: { Kim: 3, Mộc: 1 } },
      },
    );
    const raw = merged?._raw as Record<string, unknown>;
    expect(raw.support_ratio).toBe(0.4);
    const d = laSoJsonToChiTiet(merged);
    expect(d.nguHanh.kim).toBeCloseTo(75, 5);
  });

  it("extractLaSoChiTietEnrichment lấy _raw từ bọc data/result", () => {
    const ext = extractLaSoChiTietEnrichment({
      data: {
        _raw: { element_counts: { Kim: 1, Mộc: 3 } },
      },
    });
    expect(ext).toEqual({
      _raw: { element_counts: { Kim: 1, Mộc: 3 } },
    });
    const merged = mergeLaSoJsonForChiTietDisplay(
      { pillars: {} } as LaSoJson,
      ext,
    );
    const d = laSoJsonToChiTiet(merged);
    expect(d.nguHanh.kim).toBeCloseTo(25, 5);
    expect(d.nguHanh.moc).toBeCloseTo(75, 5);
  });
});

describe("extractHourPillarPreview", () => {
  it("reads hour pillar from tu-tru response", () => {
    expect(
      extractHourPillarPreview({
        pillars: {
          hour: {
            can: { name: "Ất", hanh: "Mộc" },
            chi: { name: "Mão" },
          },
        },
      }),
    ).toEqual({ label: "Ất Mão", hanh: "Mộc" });
  });

  it("returns null when hour pillar missing", () => {
    expect(extractHourPillarPreview({ pillars: {} })).toBeNull();
  });
});

describe("extractMenhMoTa", () => {
  it("returns nap_am mo_ta only", () => {
    expect(
      extractMenhMoTa({
        pillars: {
          year: {
            nap_am: {
              mo_ta: "Nước sông dài — hợp người làm việc bền bỉ.",
            },
          },
        },
      }),
    ).toBe("Nước sông dài — hợp người làm việc bền bỉ.");
  });
});

describe("buildLaSoFullPillarRows", () => {
  it("builds four pillars with day master highlight metadata", () => {
    const rows = buildLaSoFullPillarRows(
      {
        pillars: {
          year: { can: { name: "Canh", hanh: "Kim" }, chi: { name: "Ngọ" } },
          month: { can: { name: "Quý", hanh: "Thủy" }, chi: { name: "Mùi" } },
          day: { can: { name: "Quý", hanh: "Thủy" }, chi: { name: "Tỵ" } },
          hour: { can: { name: "Ất", hanh: "Mộc" }, chi: { name: "Mão" } },
        },
      },
      { ngay_sinh: "1990-05-20", gio_sinh: "05:00:00" },
    );
    expect(rows).toHaveLength(4);
    expect(rows[0]?.label).toBe("Niên");
    expect(rows[0]?.hanh).toBe("Kim");
    expect(rows[2]?.isDayMaster).toBe(true);
    expect(rows[2]?.subline).toBe("NHẬT CHỦ");
    expect(rows[3]?.subline).toMatch(/h/);
  });
});

describe("thanColorsHintVi", () => {
  it("combines palette for Kim · Thủy", () => {
    expect(thanColorsHintVi("Kim · Thủy")).toBe("Mầu trắng, xám, đen, xanh navy");
  });

  it("combines palette for Thổ · Hỏa", () => {
    expect(thanColorsHintVi("Thổ · Hỏa")).toBe("Mầu vàng, nâu, đỏ, hồng");
  });
});

describe("buildLaSoNlttTeaser", () => {
  it("builds deterministic teaser from chart facts", () => {
    const raw = {
      nhat_chu: "Quý",
      hanh: "Thủy",
      menh: "Trường Lưu Thủy",
      dung_than: "Kim · Thủy",
      ky_than: "Thổ · Hỏa",
      thap_than: { dominant: { name: "Thương Quan" } },
      dai_van: {
        current: { display: "Bính Tuất", age_range: "32-41" },
        cycles: [{ display: "Bính Tuất", start_age: 32, end_age: 41 }],
      },
    };
    const reveal = laSoJsonToRevealProps(raw);
    const detail = laSoJsonToChiTiet({
      ngu_hanh: { Kim: 22, Moc: 25, Thuy: 25, Hoa: 10, Tho: 18 },
    });
    expect(reveal).not.toBeNull();
    const text = buildLaSoNlttTeaser(raw, reveal!, detail);
    expect(text).toContain("Nhật chủ Quý Thủy");
    expect(text).toContain("Dụng Kim · Thủy");
    expect(text).toContain("Thương Quan");
  });
});
