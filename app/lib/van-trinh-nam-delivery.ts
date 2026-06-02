import {
  normalizeLaSoSectionsInput,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import type { Profile } from "~/lib/profile-context";
import { supabase } from "~/lib/supabase";
import { VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION } from "~/lib/van-trinh-nam-content-version";
import { vanTrinhNamDeliveryIsComplete } from "~/lib/van-trinh-nam-delivery-complete";
import { parseVanTrinhNamLuanContext } from "~/lib/van-trinh-nam-parse";
import {
  vanTrinhNamBirthRevision,
  type VanTrinhNamSessionData,
} from "~/lib/van-trinh-nam-session";

export { vanTrinhNamDeliveryIsComplete } from "~/lib/van-trinh-nam-delivery-complete";

export type VanTrinhNamDeliveryRecord = VanTrinhNamSessionData & {
  birthRevision: string;
  contentVersion: string;
  engineVersion: string;
};

function rowToDelivery(
  row: {
    birth_revision: string;
    content_version: string;
    engine_version: string;
    luan_context: unknown;
    sections: unknown;
    year_can_chi: string;
  },
): VanTrinhNamDeliveryRecord | null {
  const sections = normalizeLaSoSectionsInput(row.sections);
  const ctx = parseVanTrinhNamLuanContext(row.luan_context);
  if (!sections?.length || !ctx) return null;
  const engineVersion = String(row.engine_version ?? "");
  return {
    birthRevision: row.birth_revision,
    contentVersion: row.content_version,
    engineVersion,
    sections,
    yearCanChi: row.year_can_chi ?? "",
    luanContext: ctx,
  };
}

export async function fetchVanTrinhNamDelivery(
  profile: Profile,
  flowYear: number,
  opts?: { liveEngineVersion?: string },
): Promise<VanTrinhNamDeliveryRecord | null> {
  const birthRevision = vanTrinhNamBirthRevision(profile);
  const { data, error } = await supabase
    .from("van_trinh_nam_deliveries")
    .select(
      "birth_revision, content_version, engine_version, luan_context, sections, year_can_chi",
    )
    .eq("flow_year", flowYear)
    .maybeSingle();

  if (error || !data) return null;

  const delivery = rowToDelivery(data);
  if (!delivery) return null;
  if (delivery.birthRevision !== birthRevision) return null;
  if (delivery.contentVersion !== VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION) {
    return null;
  }
  if (
    opts?.liveEngineVersion &&
    delivery.engineVersion !== opts.liveEngineVersion
  ) {
    return null;
  }
  if (
    !vanTrinhNamDeliveryIsComplete(delivery.sections, delivery.luanContext)
  ) {
    return null;
  }
  return delivery;
}

export function deliveryToLoadResult(
  delivery: VanTrinhNamDeliveryRecord,
): VanTrinhNamSessionData {
  return {
    sections: delivery.sections,
    yearCanChi: delivery.yearCanChi,
    luanContext: delivery.luanContext,
    engineVersion: delivery.engineVersion,
  };
}

export async function persistVanTrinhNamDelivery(
  profile: Profile,
  flowYear: number,
  payload: VanTrinhNamSessionData,
): Promise<boolean> {
  if (payload.sections.length === 0) return false;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean }>(
    "van-trinh-nam-delivery",
    {
      body: {
        flow_year: flowYear,
        birth_revision: vanTrinhNamBirthRevision(profile),
        content_version: VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION,
        engine_version: payload.engineVersion,
        luan_context: payload.luanContext,
        sections: payload.sections,
        year_can_chi: payload.yearCanChi,
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[van-trinh-delivery] persist", error.message);
    }
    return false;
  }
  return data?.ok === true;
}

export { VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION };
