import { describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("~/lib/supabase", () => ({
  supabase: { from },
}));

import { applyLandingPrefillToProfile } from "~/lib/apply-landing-prefill-profile";

describe("applyLandingPrefillToProfile", () => {
  it("skips birth fields when form already saved them", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ update });

    await applyLandingPrefillToProfile(
      "user-1",
      {
        displayName: "Landing Name",
        ngaySinh: "1980-01-01",
        rawGioLabel: null,
        gioSinh: "23:00:00",
        gioiTinh: "nam",
      },
      { skipBirthFields: true },
    );

    expect(update).toHaveBeenCalledWith({ display_name: "Landing Name" });
  });

  it("skips display name when form already saved it", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ update });

    await applyLandingPrefillToProfile(
      "user-1",
      {
        displayName: "Landing Name",
        ngaySinh: "1980-01-01",
        rawGioLabel: null,
        gioSinh: "23:00:00",
        gioiTinh: "nam",
      },
      { skipBirthFields: true, skipDisplayName: true },
    );

    expect(update).not.toHaveBeenCalled();
  });
});
