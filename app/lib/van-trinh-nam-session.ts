import type { LaSoChiTietSection } from "~/lib/generate-reading";
import type { Profile } from "~/lib/profile-context";
import type { VanTrinhNamLuanContext } from "~/lib/van-trinh-nam-types";
import { VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION } from "~/lib/van-trinh-nam-content-version";

const VAN_TRINH_NAM_SESSION = "van-trinh-nam-ai:";

export type VanTrinhNamSessionData = {
  sections: LaSoChiTietSection[];
  yearCanChi: string;
  luanContext: VanTrinhNamLuanContext;
  engineVersion: string;
};

export function vanTrinhNamBirthRevision(p: Profile): string {
  return [
    p.ngay_sinh ?? "",
    p.gio_sinh ?? "",
    p.gioi_tinh ?? "",
    p.birth_data_locked_at ?? "",
  ].join("\x1e");
}

export function vanTrinhNamCacheRevision(
  p: Profile,
  year: number,
  engineVersion: string,
): string {
  return [
    String(year),
    engineVersion,
    VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION,
    vanTrinhNamBirthRevision(p),
  ].join("\x1e");
}

function sessionKey(profileId: string): string {
  return `${VAN_TRINH_NAM_SESSION}${profileId}`;
}

export function readVanTrinhNamSession(
  profileId: string,
  revision: string,
): VanTrinhNamSessionData | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(profileId));
    if (!raw) return null;
    const o = JSON.parse(raw) as {
      revision?: string;
      sections?: LaSoChiTietSection[];
      yearCanChi?: string;
      luanContext?: VanTrinhNamLuanContext;
      engineVersion?: string;
    };
    if (o.revision !== revision) return null;
    if (!Array.isArray(o.sections) || o.sections.length === 0) return null;
    if (!o.luanContext || typeof o.luanContext !== "object") return null;
    return {
      sections: o.sections,
      yearCanChi: typeof o.yearCanChi === "string" ? o.yearCanChi : "",
      luanContext: o.luanContext,
      engineVersion: typeof o.engineVersion === "string" ? o.engineVersion : "",
    };
  } catch {
    return null;
  }
}

export function persistVanTrinhNamSession(
  profileId: string,
  revision: string,
  data: VanTrinhNamSessionData,
): void {
  try {
    sessionStorage.setItem(
      sessionKey(profileId),
      JSON.stringify({
        v: 1,
        revision,
        sections: data.sections,
        yearCanChi: data.yearCanChi,
        luanContext: data.luanContext,
        engineVersion: data.engineVersion,
      }),
    );
  } catch {
    /* quota */
  }
}

export function currentYearVn(): number {
  return Number.parseInt(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
    }).format(new Date()),
    10,
  );
}

export function parseYearFromSearch(
  params: URLSearchParams,
): number | null {
  const raw = params.get("year");
  if (!raw) return null;
  const y = Number.parseInt(raw, 10);
  if (!Number.isFinite(y) || y < 2000 || y > 2100) return null;
  return y;
}
