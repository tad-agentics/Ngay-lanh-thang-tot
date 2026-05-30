import { describe, expect, it } from "vitest";

import {
  birthYearCanChiTuoiLabel,
  formatNgaySinhDisplayDot,
  formatProfileBirthSubline,
  gioSinhToCanhNameVi,
} from "./profile-birth-line";

describe("formatNgaySinhDisplayDot", () => {
  it("formats ISO date with dots", () => {
    expect(formatNgaySinhDisplayDot("1990-03-21")).toBe("21.03.1990");
    expect(formatNgaySinhDisplayDot("1990-05-20")).toBe("20.05.1990");
  });
});

describe("gioSinhToCanhNameVi", () => {
  it("maps postgres time to canh name", () => {
    expect(gioSinhToCanhNameVi("05:00:00")).toBe("Mão");
    expect(gioSinhToCanhNameVi("11:00:00")).toBe("Ngọ");
  });
});

describe("formatProfileBirthSubline", () => {
  it("matches Direction C maket", () => {
    expect(
      formatProfileBirthSubline({
        display_name: "Nguyễn Thị Minh",
        ngay_sinh: "1990-05-20",
        gio_sinh: "05:00:00",
        la_so: { birth_year_can_chi: "Canh Ngọ" },
      }),
    ).toBe("Nguyễn Thị Minh · sinh 20.05.1990 · giờ Mão · Canh Ngọ 1990");
  });

  it("optional gender segment for lá số full", () => {
    expect(
      formatProfileBirthSubline(
        {
          display_name: "Nguyễn Thị Minh",
          gioi_tinh: "nu",
          ngay_sinh: "1990-05-20",
          gio_sinh: "05:00:00",
          la_so: { can_chi_year: "Canh Ngọ" },
        },
        { includeGender: true },
      ),
    ).toBe("Nguyễn Thị Minh · Nữ · sinh 20.05.1990 · giờ Mão · Canh Ngọ 1990");
  });
});

describe("birthYearCanChiTuoiLabel", () => {
  it("joins can chi and birth year", () => {
    expect(birthYearCanChiTuoiLabel({ birth_year_can_chi: "Canh Ngọ" }, "1990-03-21")).toBe(
      "Canh Ngọ 1990",
    );
  });
});
