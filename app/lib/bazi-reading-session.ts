import type { LaSoJson } from "~/lib/api-types";
import type { LaSoChiTietSection } from "~/lib/generate-reading";
import type { Profile } from "~/hooks/useProfile";

const BAZI_READING_SESSION = "bazi-reading-ai:";

export type BaziReadingSessionData = {
  sections: LaSoChiTietSection[];
  yearCanChi: string;
  laSoDisplay: LaSoJson | null;
  luuNienFactsRaw: unknown | null;
  phongThuyFactsRaw: unknown | null;
};

/** Hash hồ sơ sinh — khớp `bazi_reading_deliveries.birth_revision`. */
export function baziReadingBirthRevision(p: Profile): string {
  return [
    p.ngay_sinh ?? "",
    p.gio_sinh ?? "",
    p.gioi_tinh ?? "",
    p.birth_data_locked_at ?? "",
  ].join("\x1e");
}

export function baziReadingCacheRevision(p: Profile, year?: number): string {
  const y =
    year ??
    Number.parseInt(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
      }).format(new Date()),
      10,
    );
  return [String(y), "w12", baziReadingBirthRevision(p)].join("\x1e");
}

function sessionKey(profileId: string): string {
  return `${BAZI_READING_SESSION}${profileId}`;
}

export function readBaziReadingSession(
  profileId: string,
  revision: string,
): BaziReadingSessionData | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(profileId));
    if (!raw) return null;
    const o = JSON.parse(raw) as {
      v?: number;
      revision?: string;
      sections?: LaSoChiTietSection[];
      yearCanChi?: string;
      laSoDisplay?: LaSoJson | null;
      luuNienFactsRaw?: unknown;
      phongThuyFactsRaw?: unknown;
    };
    if (o.revision !== revision) return null;
    if (!Array.isArray(o.sections) || o.sections.length === 0) return null;

    if (o.v === 2) {
      return {
        sections: o.sections,
        yearCanChi: typeof o.yearCanChi === "string" ? o.yearCanChi : "",
        laSoDisplay: o.laSoDisplay ?? null,
        luuNienFactsRaw: o.luuNienFactsRaw ?? null,
        phongThuyFactsRaw: o.phongThuyFactsRaw ?? null,
      };
    }

    // v1 — chỉ sections (revision w11 invalidates stale v1 blobs)
    if (o.v === 1) {
      return {
        sections: o.sections,
        yearCanChi: "",
        laSoDisplay: null,
        luuNienFactsRaw: null,
        phongThuyFactsRaw: null,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function persistBaziReadingSession(
  profileId: string,
  revision: string,
  data: BaziReadingSessionData,
): void {
  if (data.sections.length === 0) return;
  try {
    sessionStorage.setItem(
      sessionKey(profileId),
      JSON.stringify({
        v: 2,
        revision,
        sections: data.sections,
        yearCanChi: data.yearCanChi,
        laSoDisplay: data.laSoDisplay,
        luuNienFactsRaw: data.luuNienFactsRaw,
        phongThuyFactsRaw: data.phongThuyFactsRaw,
      }),
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
