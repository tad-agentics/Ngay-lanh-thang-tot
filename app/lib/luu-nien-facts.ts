import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Profile } from "~/lib/profile-context";

/** Fetch vận năm facts from tu-tru-api (`GET /v1/la-so/luu-nien`). */
export async function fetchLuuNienYearFacts(
  profile: Profile,
  year: number,
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
    op: "la-so-luu-nien",
    body: { ...body, year },
  });
}
