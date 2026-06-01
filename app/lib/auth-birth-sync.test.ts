import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: { updateUser: vi.fn() },
  },
}));

import { parseSignupBirthFromMetadata } from "~/lib/auth-birth-sync";

describe("parseSignupBirthFromMetadata", () => {
  it("reads signup stash from user_metadata", () => {
    expect(
      parseSignupBirthFromMetadata({
        ngay_sinh: "1990-05-15",
        gio_sinh: "05:00:00",
        gioi_tinh: "nu",
      }),
    ).toEqual({
      ngay_sinh: "1990-05-15",
      gio_sinh: "05:00:00",
      gioi_tinh: "nu",
    });
  });

  it("returns null when any field missing", () => {
    expect(
      parseSignupBirthFromMetadata({
        ngay_sinh: "1990-05-15",
        gioi_tinh: "nam",
      }),
    ).toBeNull();
  });
});
