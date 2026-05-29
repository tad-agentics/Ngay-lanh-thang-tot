import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Profile } from "~/lib/profile-context";

/** Fetch phong thủy năm facts from tu-tru-api (`GET /v1/phong-thuy`). */
export async function fetchPhongThuyYearFacts(
  profile: Profile,
  year: number,
  purpose = "general",
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
