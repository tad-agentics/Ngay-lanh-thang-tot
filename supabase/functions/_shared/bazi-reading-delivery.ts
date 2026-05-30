import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type BaziDeliverySection = {
  id: string;
  title: string;
  text: string;
};

export type BaziReadingDeliveryRow = {
  flow_year: number;
  birth_revision: string;
  content_version: string;
  sections: BaziDeliverySection[];
  la_so_display: unknown | null;
  luu_nien_facts: unknown | null;
  phong_thuy_facts: unknown | null;
  year_can_chi: string;
  generated_at: string;
  updated_at: string;
};

const MAX_SECTIONS = 24;
const MAX_ID_LEN = 64;
const MAX_TITLE_LEN = 120;
const MAX_TEXT_LEN = 32_000;
const MAX_REVISION_LEN = 256;
const MAX_VERSION_LEN = 128;
const MAX_YEAR_CAN_CHI_LEN = 80;

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

export function normalizeDeliverySections(raw: unknown): BaziDeliverySection[] | null {
  if (!Array.isArray(raw)) return null;
  const out: BaziDeliverySection[] = [];
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

export type UpsertBaziDeliveryInput = {
  userId: string;
  flowYear: number;
  birthRevision: string;
  contentVersion: string;
  sections: BaziDeliverySection[];
  laSoDisplay: unknown | null;
  luuNienFacts: unknown | null;
  phongThuyFacts: unknown | null;
  yearCanChi: string;
};

export async function upsertBaziReadingDelivery(
  admin: SupabaseClient,
  input: UpsertBaziDeliveryInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const birthRevision = input.birthRevision.trim().slice(0, MAX_REVISION_LEN);
  const contentVersion = input.contentVersion.trim().slice(0, MAX_VERSION_LEN);
  if (!birthRevision || !contentVersion) {
    return { ok: false, message: "Thiếu birth_revision hoặc content_version." };
  }
  if (input.flowYear < 2000 || input.flowYear > 2100) {
    return { ok: false, message: "flow_year không hợp lệ." };
  }
  const sections = normalizeDeliverySections(input.sections);
  if (!sections?.length) {
    return { ok: false, message: "sections rỗng." };
  }

  const now = new Date().toISOString();
  const row = {
    birth_revision: birthRevision,
    content_version: contentVersion,
    sections,
    la_so_display: input.laSoDisplay,
    luu_nien_facts: input.luuNienFacts,
    phong_thuy_facts: input.phongThuyFacts,
    year_can_chi: input.yearCanChi.trim().slice(0, MAX_YEAR_CAN_CHI_LEN),
    updated_at: now,
  };

  const { data: existing, error: readErr } = await admin
    .from("bazi_reading_deliveries")
    .select("id")
    .eq("user_id", input.userId)
    .eq("flow_year", input.flowYear)
    .maybeSingle();

  if (readErr) {
    console.error("bazi_reading_deliveries read", readErr.message);
    return { ok: false, message: "Không lưu được luận giải." };
  }

  if (existing?.id) {
    const { error } = await admin
      .from("bazi_reading_deliveries")
      .update(row)
      .eq("id", existing.id);
    if (error) {
      console.error("bazi_reading_deliveries update", error.message);
      return { ok: false, message: "Không lưu được luận giải." };
    }
    return { ok: true };
  }

  const { error } = await admin.from("bazi_reading_deliveries").insert({
    user_id: input.userId,
    flow_year: input.flowYear,
    ...row,
    generated_at: now,
  });

  if (error) {
    console.error("bazi_reading_deliveries insert", error.message);
    return { ok: false, message: "Không lưu được luận giải." };
  }
  return { ok: true };
}

export async function loadBaziReadingDeliveryRow(
  admin: SupabaseClient,
  userId: string,
  flowYear: number,
): Promise<BaziReadingDeliveryRow | null> {
  const { data, error } = await admin
    .from("bazi_reading_deliveries")
    .select(
      "flow_year, birth_revision, content_version, sections, la_so_display, luu_nien_facts, phong_thuy_facts, year_can_chi, generated_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("flow_year", flowYear)
    .maybeSingle();

  if (error || !data) return null;
  const sections = normalizeDeliverySections(data.sections);
  if (!sections?.length) return null;

  return {
    flow_year: data.flow_year as number,
    birth_revision: String(data.birth_revision ?? ""),
    content_version: String(data.content_version ?? ""),
    sections,
    la_so_display: data.la_so_display ?? null,
    luu_nien_facts: data.luu_nien_facts ?? null,
    phong_thuy_facts: data.phong_thuy_facts ?? null,
    year_can_chi: String(data.year_can_chi ?? ""),
    generated_at: String(data.generated_at ?? ""),
    updated_at: String(data.updated_at ?? ""),
  };
}
