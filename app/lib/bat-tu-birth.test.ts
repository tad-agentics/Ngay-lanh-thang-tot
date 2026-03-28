import { describe, expect, it } from "vitest";

import {
  ddMmYyyyInputToBatTuBirthDate,
  ddMmYyyyInputToIsoDate,
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
