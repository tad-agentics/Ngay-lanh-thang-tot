import type { LaSoChiTietSection } from "~/lib/generate-reading";
import type { Profile } from "~/hooks/useProfile";

const BAZI_READING_SESSION = "bazi-reading-ai:";

export function baziReadingCacheRevision(p: Profile): string {
  return [
    p.ngay_sinh ?? "",
    p.gio_sinh ?? "",
    p.gioi_tinh ?? "",
    p.birth_data_locked_at ?? "",
  ].join("\x1e");
}

function sessionKey(profileId: string): string {
  return `${BAZI_READING_SESSION}${profileId}`;
}

export function readBaziReadingSession(
  profileId: string,
  revision: string,
): LaSoChiTietSection[] | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(profileId));
    if (!raw) return null;
    const o = JSON.parse(raw) as {
      v?: number;
      revision?: string;
      sections?: LaSoChiTietSection[];
    };
    if (o.v !== 1 || o.revision !== revision) return null;
    if (!Array.isArray(o.sections) || o.sections.length === 0) return null;
    return o.sections;
  } catch {
    return null;
  }
}

export function persistBaziReadingSession(
  profileId: string,
  revision: string,
  sections: LaSoChiTietSection[],
): void {
  if (sections.length === 0) return;
  try {
    sessionStorage.setItem(
      sessionKey(profileId),
      JSON.stringify({ v: 1, revision, sections }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function currentYearVn(): number {
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).format(new Date());
  return Number.parseInt(y, 10);
}
