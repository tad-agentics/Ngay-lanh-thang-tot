import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Profile } from "~/lib/profile-context";

/** `GET /v1/phong-thuy` — màn 18 §04 dùng nhà ở. */
export const BAZI_PHONG_THUY_PURPOSE = "NHA_O" as const;

export type PhongThuyPurpose =
  | typeof BAZI_PHONG_THUY_PURPOSE
  | "VAN_PHONG"
  | "CUA_HANG"
  | "PHONG_KHACH";

/** Fetch phong thủy năm facts from tu-tru-api (`GET /v1/phong-thuy`). */
export async function fetchPhongThuyYearFacts(
  profile: Profile,
  year: number,
  purpose: PhongThuyPurpose = BAZI_PHONG_THUY_PURPOSE,
) {
  const body = profileToBatTuPersonQuery(profile);
  if (!body.birth_date) {
    return {
      ok: false as const,
      code: "MISSING_BIRTH",
      message: "Cần ngày sinh trên hồ sơ.",
    };
  }
  return invokeBatTu<unknown>({
    op: "phong-thuy",
    body: { ...body, year, purpose, detail: "full" },
  });
}
