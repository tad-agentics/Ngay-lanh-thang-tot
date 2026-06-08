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

/** Trường sinh dùng để hash revision — chỉ phụ thuộc dữ liệu sinh, không cả Profile. */
type BaziReadingBirthFields = Pick<
  Profile,
  "ngay_sinh" | "gio_sinh" | "gioi_tinh" | "birth_data_locked_at"
>;

/** Hash hồ sơ sinh — khớp `bazi_reading_deliveries.birth_revision`. */
export function baziReadingBirthRevision(p: BaziReadingBirthFields): string {
  return [
    p.ngay_sinh ?? "",
    p.gio_sinh ?? "",
    p.gioi_tinh ?? "",
    p.birth_data_locked_at ?? "",
  ].join("\x1e");
}

export function baziReadingCacheRevision(
  p: BaziReadingBirthFields,
  year?: number,
): string {
  const y =
    year ??
    Number.parseInt(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
      }).format(new Date()),
      10,
    );
  // w14 — invalidate paywall menh teaser session after mirror-opening prompt + flash LLM
  return [String(y), "w14", baziReadingBirthRevision(p)].join("\x1e");
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

/** Paywall teaser (§01 mệnh tổng quan) — chỉ menh + lá số hiển thị, cho non-buyer. */
const BAZI_PAYWALL_TEASER_SESSION = "bazi-paywall-teaser:";

export type BaziPaywallTeaserSession = {
  menhOverview: string;
  laSoDisplay: LaSoJson | null;
};

function paywallTeaserSessionKey(profileId: string): string {
  return `${BAZI_PAYWALL_TEASER_SESSION}${profileId}`;
}

export function readBaziPaywallTeaserSession(
  profileId: string,
  revision: string,
): BaziPaywallTeaserSession | null {
  try {
    const raw = sessionStorage.getItem(paywallTeaserSessionKey(profileId));
    if (!raw) return null;
    const o = JSON.parse(raw) as {
      v?: number;
      revision?: string;
      menhOverview?: string;
      laSoDisplay?: LaSoJson | null;
    };
    if (o.v !== 1 || o.revision !== revision) return null;
    if (typeof o.menhOverview !== "string" || !o.menhOverview) return null;
    return {
      menhOverview: o.menhOverview,
      laSoDisplay: o.laSoDisplay ?? null,
    };
  } catch {
    return null;
  }
}

export function persistBaziPaywallTeaserSession(
  profileId: string,
  revision: string,
  data: BaziPaywallTeaserSession,
): void {
  if (!data.menhOverview) return;
  try {
    sessionStorage.setItem(
      paywallTeaserSessionKey(profileId),
      JSON.stringify({
        v: 1,
        revision,
        menhOverview: data.menhOverview,
        laSoDisplay: data.laSoDisplay,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

const BAZI_PAYWALL_TEASER_LOCAL = "bazi-paywall-teaser-local:";

function paywallTeaserLocalKey(profileId: string): string {
  return `${BAZI_PAYWALL_TEASER_LOCAL}${profileId}`;
}

function parsePaywallTeaserPayload(
  raw: string,
  revision: string,
): BaziPaywallTeaserSession | null {
  const o = JSON.parse(raw) as {
    v?: number;
    revision?: string;
    menhOverview?: string;
    laSoDisplay?: LaSoJson | null;
  };
  if (o.v !== 1 || o.revision !== revision) return null;
  if (typeof o.menhOverview !== "string" || !o.menhOverview) return null;
  return {
    menhOverview: o.menhOverview,
    laSoDisplay: o.laSoDisplay ?? null,
  };
}

export function readBaziPaywallTeaserLocal(
  profileId: string,
  revision: string,
): BaziPaywallTeaserSession | null {
  try {
    const raw = localStorage.getItem(paywallTeaserLocalKey(profileId));
    if (!raw) return null;
    return parsePaywallTeaserPayload(raw, revision);
  } catch {
    return null;
  }
}

export function persistBaziPaywallTeaserLocal(
  profileId: string,
  revision: string,
  data: BaziPaywallTeaserSession,
): void {
  if (!data.menhOverview) return;
  try {
    localStorage.setItem(
      paywallTeaserLocalKey(profileId),
      JSON.stringify({
        v: 1,
        revision,
        menhOverview: data.menhOverview,
        laSoDisplay: data.laSoDisplay,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

/** Drop persisted paywall prose on sign-out (profile-keyed; not session-scoped). */
export function clearBaziPaywallTeaserLocalAll(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BAZI_PAYWALL_TEASER_LOCAL)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

/** Session first, then localStorage — instant teaser on /toi without skeleton. */
export function readBaziPaywallTeaserCache(
  profileId: string,
  revision: string,
): BaziPaywallTeaserSession | null {
  return (
    readBaziPaywallTeaserSession(profileId, revision) ??
    readBaziPaywallTeaserLocal(profileId, revision)
  );
}

export function persistBaziPaywallTeaserCache(
  profileId: string,
  revision: string,
  data: BaziPaywallTeaserSession,
): void {
  persistBaziPaywallTeaserSession(profileId, revision, data);
  persistBaziPaywallTeaserLocal(profileId, revision, data);
}

export function currentYearVn(): number {
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).format(new Date());
  return Number.parseInt(y, 10);
}
