import type { LaSoJson } from "~/lib/api-types";
import { BAZI_READING_DELIVERY_CONTENT_VERSION } from "~/lib/bazi-reading-content-version";
import { laSoPillarsMatch } from "../../shared/la-so-pillar-identity.ts";
import {
  baziReadingBirthRevision,
  type BaziReadingSessionData,
} from "~/lib/bazi-reading-session";
import {
  normalizeLaSoSectionsInput,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import type { Profile } from "~/lib/profile-context";
import { supabase } from "~/lib/supabase";

export type BaziReadingDeliveryRecord = BaziReadingSessionData & {
  birthRevision: string;
  contentVersion: string;
};

function rowToDelivery(
  row: {
    birth_revision: string;
    content_version: string;
    sections: unknown;
    la_so_display: unknown;
    luu_nien_facts: unknown;
    phong_thuy_facts: unknown;
    year_can_chi: string;
  },
): BaziReadingDeliveryRecord | null {
  const sections = normalizeLaSoSectionsInput(row.sections);
  if (sections.length === 0) return null;
  return {
    birthRevision: row.birth_revision,
    contentVersion: row.content_version,
    sections,
    yearCanChi: row.year_can_chi ?? "",
    laSoDisplay: (row.la_so_display as LaSoJson) ?? null,
    luuNienFactsRaw: row.luu_nien_facts ?? null,
    phongThuyFactsRaw: row.phong_thuy_facts ?? null,
  };
}

/** Đọc bài full đã mua từ Postgres (RLS). */
export async function fetchBaziReadingDelivery(
  profile: Profile,
  flowYear: number,
): Promise<BaziReadingDeliveryRecord | null> {
  const birthRevision = baziReadingBirthRevision(profile);
  const { data, error } = await supabase
    .from("bazi_reading_deliveries")
    .select(
      "birth_revision, content_version, sections, la_so_display, luu_nien_facts, phong_thuy_facts, year_can_chi",
    )
    .eq("flow_year", flowYear)
    .maybeSingle();

  if (error || !data) return null;

  const delivery = rowToDelivery(data);
  if (!delivery) return null;

  if (delivery.birthRevision !== birthRevision) return null;
  if (delivery.contentVersion !== BAZI_READING_DELIVERY_CONTENT_VERSION) {
    return null;
  }
  if (
    delivery.laSoDisplay &&
    profile.la_so &&
    !laSoPillarsMatch(delivery.laSoDisplay, profile.la_so)
  ) {
    return null;
  }

  return delivery;
}

export function deliveryToLoadResult(
  delivery: BaziReadingDeliveryRecord,
): BaziReadingSessionData {
  return {
    sections: delivery.sections,
    laSoDisplay: delivery.laSoDisplay,
    luuNienFactsRaw: delivery.luuNienFactsRaw,
    phongThuyFactsRaw: delivery.phongThuyFactsRaw,
    yearCanChi: delivery.yearCanChi,
  };
}

export type BaziReadingPersistPayload = BaziReadingSessionData;

/** Lưu bài full sau generate — Edge `bazi-reading-delivery`. */
export async function persistBaziReadingDelivery(
  profile: Profile,
  flowYear: number,
  payload: BaziReadingPersistPayload,
): Promise<boolean> {
  if (payload.sections.length === 0) return false;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean }>(
    "bazi-reading-delivery",
    {
      body: {
        flow_year: flowYear,
        birth_revision: baziReadingBirthRevision(profile),
        content_version: BAZI_READING_DELIVERY_CONTENT_VERSION,
        sections: payload.sections,
        la_so_display: payload.laSoDisplay,
        luu_nien_facts: payload.luuNienFactsRaw,
        phong_thuy_facts: payload.phongThuyFactsRaw,
        year_can_chi: payload.yearCanChi,
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[bazi-delivery] persist", error.message);
    }
    return false;
  }
  return data?.ok === true;
}

export { BAZI_READING_DELIVERY_CONTENT_VERSION };
