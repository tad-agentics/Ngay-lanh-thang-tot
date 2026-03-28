import { describe, expect, it } from "vitest";

import {
  ddMmYyyyInputToBatTuBirthDate,
  ddMmYyyyInputToIsoDate,
  formatDdMmYyyyWithAutoSlash,
  isPartialDdMmYyyyInput,
  isoYmdToDdMmYyyyInput,
  sanitizeDdMmYyyyInput,
} from "./bat-tu-birth";

describe("ddMmYyyyInputToBatTuBirthDate", () => {
  it("chấp nhận dd/mm/yyyy hợp lệ", () => {
    expect(ddMmYyyyInputToBatTuBirthDate("05/05/1990")).toBe("05/05/1990");
    expect(ddMmYyyyInputToBatTuBirthDate("31/12/2024")).toBe("31/12/2024");
  });

  it("chấp nhận 1 chữ số ngày/tháng", () => {
    expect(ddMmYyyyInputToBatTuBirthDate("5/5/1990")).toBe("05/05/1990");
  });

  it("từ chối ngày không tồn tại", () => {
    expect(ddMmYyyyInputToBatTuBirthDate("31/02/2024")).toBeNull();
    expect(ddMmYyyyInputToBatTuBirthDate("32/01/2024")).toBeNull();
  });

  it("từ chối định dạng khác", () => {
    expect(ddMmYyyyInputToBatTuBirthDate("1990-05-05")).toBeNull();
    expect(ddMmYyyyInputToBatTuBirthDate("05-05-1990")).toBeNull();
    expect(ddMmYyyyInputToBatTuBirthDate("")).toBeNull();
  });
});

describe("isoYmdToDdMmYyyyInput / ddMmYyyyInputToIsoDate", () => {
  it("round-trip ISO ↔ hiển thị", () => {
    expect(isoYmdToDdMmYyyyInput("1990-05-20")).toBe("20/05/1990");
    expect(ddMmYyyyInputToIsoDate("20/05/1990")).toBe("1990-05-20");
  });

  it("sanitize loại ký tự lạ", () => {
    expect(sanitizeDdMmYyyyInput("20a/05/1990x")).toBe("20/05/1990");
  });
});

describe("formatDdMmYyyyWithAutoSlash", () => {
  it("chèn / sau ngày và tháng khi gõ", () => {
    expect(formatDdMmYyyyWithAutoSlash("23")).toBe("23/");
    expect(formatDdMmYyyyWithAutoSlash("230")).toBe("23/0");
    expect(formatDdMmYyyyWithAutoSlash("2305")).toBe("23/05/");
    expect(formatDdMmYyyyWithAutoSlash("23051990")).toBe("23/05/1990");
  });

  it("giữ 0–2 chữ số đầu chưa đủ ngày", () => {
    expect(formatDdMmYyyyWithAutoSlash("2")).toBe("2");
    expect(formatDdMmYyyyWithAutoSlash("")).toBe("");
  });

  it("chấp nhận dán có slash hoặc chỉ số", () => {
    expect(formatDdMmYyyyWithAutoSlash("23/05/1990")).toBe("23/05/1990");
    expect(formatDdMmYyyyWithAutoSlash("ab2305xy1990")).toBe("23/05/1990");
  });
});

describe("isPartialDdMmYyyyInput", () => {
  it("nhận diện đang gõ dở (có / tự chèn)", () => {
    expect(isPartialDdMmYyyyInput("23/")).toBe(true);
    expect(isPartialDdMmYyyyInput("23/05/")).toBe(true);
    expect(isPartialDdMmYyyyInput("23/05/199")).toBe(true);
  });

  it("không báo partial khi đủ hoặc sai hoàn chỉnh", () => {
    expect(isPartialDdMmYyyyInput("23/05/1990")).toBe(false);
    expect(isPartialDdMmYyyyInput("31/02/2020")).toBe(false);
  });
});
