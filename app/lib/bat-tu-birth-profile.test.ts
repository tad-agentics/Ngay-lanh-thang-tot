import { describe, expect, it } from "vitest";

import { profileCanUseBatTu } from "~/lib/bat-tu-birth";

describe("profileCanUseBatTu", () => {
  it("requires birth date and hour", () => {
    expect(profileCanUseBatTu(null)).toBe(false);
    expect(
      profileCanUseBatTu({
        ngay_sinh: "1990-05-20",
        gio_sinh: null,
      } as never),
    ).toBe(false);
    expect(
      profileCanUseBatTu({
        ngay_sinh: "1990-05-20",
        gio_sinh: "05:00:00",
      } as never),
    ).toBe(true);
  });
});
