import { describe, expect, it } from "vitest";

import { mapTieuVanPayload } from "./tieu-van-ui";

describe("mapTieuVanPayload", () => {
  it("uses prose fallbacks when string fields missing", () => {
    const ui = mapTieuVanPayload({
      tong_quan: "",
      can_luu: "",
      tru_thang: "",
    });
    expect(ui.tongQuan).toContain("biến động nhẹ");
    expect(ui.canLuu).toContain("Tránh quyết định");
    expect(ui.pillarHint).toBe("—");
    expect(ui.tags).toEqual([]);
    expect(ui.linhVuc).toEqual([]);
  });

  it("keeps API strings when present", () => {
    const ui = mapTieuVanPayload({
      tong_quan: "  Tổng quan từ API  ",
      can_luu: "Gợi ý từ API",
      tru_thang: "Giáp Tý",
    });
    expect(ui.tongQuan).toBe("Tổng quan từ API");
    expect(ui.canLuu).toBe("Gợi ý từ API");
    expect(ui.pillarHint).toBe("Giáp Tý");
  });

  it("maps tu-tru-api shape: reading, pillar, tags, dai_van — không tạo điểm số giả", () => {
    const ui = mapTieuVanPayload({
      status: "success",
      month: "2026-03",
      tieu_van_pillar: {
        display: "Nhâm Thìn",
        can_name: "Nhâm",
        chi_name: "Thìn",
      },
      reading: "Tháng này bạn có ưu thế nhất định.",
      tags: ["Khá tốt", "Chủ động"],
      dai_van_context: "Đang trong vận Bính Tuất — cẩn trọng.",
      element_relation: "tuong_sinh",
      user_menh: { name: "Hải Trung Kim", hanh: "Kim" },
      nhat_chu: "Canh Kim",
    });
    expect(ui.tongQuan).toBe("Tháng này bạn có ưu thế nhất định.");
    expect(ui.pillarHint).toBe("Nhâm Thìn");
    expect(ui.canLuu).toContain("Bính Tuất");
    expect(ui.tags).toEqual(["Khá tốt", "Chủ động"]);
    expect(ui.linhVuc.length).toBe(0);
    expect(ui.elementRelationCode).toBe("tuong_sinh");
    expect(ui.elementRelationLabel).toContain("tương sinh");
    expect(ui.userMenhLabel).toContain("Hải Trung Kim");
    expect(ui.nhatChuApi).toBe("Canh Kim");
  });

  it("does not surface score-only rows as linhVuc (định tính cần prose)", () => {
    const ui = mapTieuVanPayload({
      cac_giai: [{ label: "Tài vận", value: 50, note: "" }],
    });
    expect(ui.linhVuc.length).toBe(0);
  });

  it("joins can_luu from warnings string[] when không có chuỗi đơn", () => {
    const ui = mapTieuVanPayload({
      warnings: ["Tránh quyết định gấp.", "Ưu tiên nghỉ cuối tuần."],
    });
    expect(ui.canLuu).toContain("Tránh quyết");
    expect(ui.canLuu).toContain("nghỉ cuối tuần");
  });

  it("uses qualitative fallback when element_relation code không trong bảng dịch", () => {
    const ui = mapTieuVanPayload({
      element_relation: "unknown_code",
      reading: "Tổng quan.",
    });
    expect(ui.elementRelationCode).toBe("unknown_code");
    expect(ui.elementRelationLabel).toContain("nhịp riêng");
  });

  it("maps cac_giai / details into linhVuc when có mô tả chữ", () => {
    const fromCacGiai = mapTieuVanPayload({
      cac_giai: [
        { label: "Tài vận", value: 80, note: "Thuận để thu tiền về." },
      ],
    });
    expect(fromCacGiai.linhVuc).toHaveLength(1);
    expect(fromCacGiai.linhVuc[0]?.title).toBe("Tài vận");
    expect(fromCacGiai.linhVuc[0]?.body).toContain("thu tiền");

    const fromDetails = mapTieuVanPayload({
      details: [
        { category: "Sức khoẻ", score: 70, description: "Nên ngủ đủ giấc." },
      ],
    });
    expect(fromDetails.linhVuc).toHaveLength(1);
    expect(fromDetails.linhVuc[0]?.title).toBe("Sức khoẻ");
    expect(fromDetails.linhVuc[0]?.body).toContain("ngủ");
  });
});
