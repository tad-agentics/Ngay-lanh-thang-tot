import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Khớp `app/lib/van-trinh-nam-content-version.ts`. */
export const VAN_TRINH_NAM_DELIVERY_CONTENT_VERSION =
  "2026-06-02-van-trinh-nam-v1";

export type VanTrinhNamDeliverySection = {
  id: string;
  title: string;
  text: string;
};

const MAX_SECTIONS = 64;
const MAX_ID_LEN = 64;
const MAX_TITLE_LEN = 120;
const MAX_TEXT_LEN = 32_000;
const MAX_REVISION_LEN = 256;
const MAX_VERSION_LEN = 128;
const MAX_YEAR_CAN_CHI_LEN = 80;
const MAX_ENGINE_LEN = 32;

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

export function normalizeVanTrinhNamSections(
  raw: unknown,
): VanTrinhNamDeliverySection[] | null {
  if (!Array.isArray(raw)) return null;
  const out: VanTrinhNamDeliverySection[] = [];
  for (const row of raw) {
    if (out.length >= MAX_SECTIONS) break;
    const r = asRecord(row);
    if (!r) continue;
    const id =
      typeof r.id === "string" ? r.id.trim().slice(0, MAX_ID_LEN) : "";
    const title =
      typeof r.title === "string"
        ? r.title.trim().slice(0, MAX_TITLE_LEN)
        : "";
    let text =
      typeof r.text === "string" ? r.text.trim() : "";
    if (text.length > MAX_TEXT_LEN) text = text.slice(0, MAX_TEXT_LEN);
    if (!id || !text) continue;
    out.push({ id, title: title || id, text });
  }
  return out.length > 0 ? out : null;
}

export type UpsertVanTrinhNamDeliveryInput = {
  userId: string;
  flowYear: number;
  birthRevision: string;
  contentVersion: string;
  engineVersion: string;
  luanContext: unknown;
  sections: VanTrinhNamDeliverySection[];
  yearCanChi: string;
};

export async function upsertVanTrinhNamDelivery(
  admin: SupabaseClient,
  input: UpsertVanTrinhNamDeliveryInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const birthRevision = input.birthRevision.trim().slice(0, MAX_REVISION_LEN);
  const contentVersion = input.contentVersion.trim().slice(0, MAX_VERSION_LEN);
  const engineVersion = input.engineVersion.trim().slice(0, MAX_ENGINE_LEN);
  if (!birthRevision || !contentVersion) {
    return { ok: false, message: "Thiếu birth_revision hoặc content_version." };
  }
  if (input.flowYear < 2000 || input.flowYear > 2100) {
    return { ok: false, message: "flow_year không hợp lệ." };
  }
  const sections = normalizeVanTrinhNamSections(input.sections);
  if (!sections?.length) {
    return { ok: false, message: "sections rỗng." };
  }
  if (input.luanContext == null || typeof input.luanContext !== "object") {
    return { ok: false, message: "luan_context không hợp lệ." };
  }

  const now = new Date().toISOString();
  const row = {
    birth_revision: birthRevision,
    content_version: contentVersion,
    engine_version: engineVersion,
    luan_context: input.luanContext,
    sections,
    year_can_chi: input.yearCanChi.trim().slice(0, MAX_YEAR_CAN_CHI_LEN),
    updated_at: now,
  };

  const { data: existing, error: readErr } = await admin
    .from("van_trinh_nam_deliveries")
    .select("id")
    .eq("user_id", input.userId)
    .eq("flow_year", input.flowYear)
    .maybeSingle();

  if (readErr) {
    console.error("van_trinh_nam_deliveries read", readErr.message);
    return { ok: false, message: "Không lưu được luận giải." };
  }

  if (existing?.id) {
    const { error } = await admin
      .from("van_trinh_nam_deliveries")
      .update(row)
      .eq("id", existing.id);
    if (error) {
      console.error("van_trinh_nam_deliveries update", error.message);
      return { ok: false, message: "Không lưu được luận giải." };
    }
    return { ok: true };
  }

  const { error } = await admin.from("van_trinh_nam_deliveries").insert({
    user_id: input.userId,
    flow_year: input.flowYear,
    ...row,
    generated_at: now,
  });

  if (error) {
    console.error("van_trinh_nam_deliveries insert", error.message);
    return { ok: false, message: "Không lưu được luận giải." };
  }
  return { ok: true };
}
