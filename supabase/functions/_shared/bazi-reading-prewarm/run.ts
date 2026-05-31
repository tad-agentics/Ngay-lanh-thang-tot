import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  BAZI_READING_DELIVERY_CONTENT_VERSION,
  loadBaziReadingDeliveryRow,
  upsertBaziReadingDelivery,
  type BaziDeliverySection,
} from "../bazi-reading-delivery.ts";
import { userHasBaziReadingAccess } from "../bazi-reading-gate.ts";
import {
  baziReadingBirthRevision,
  currentYearVn,
  profileToBatTuPersonQuery,
  type PrewarmProfileRow,
} from "./profile-bat-tu.ts";

const STAGGER_MS = 1_500;

type GenSection = BaziDeliverySection;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSections(json: Record<string, unknown> | null): GenSection[] {
  if (!json) return [];
  const raw = json.sections;
  if (!Array.isArray(raw)) return [];
  const out: GenSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const text = typeof r.text === "string" ? r.text.trim() : "";
    const title = typeof r.title === "string" ? r.title.trim() : id;
    if (!id || !text) continue;
    out.push({ id, title: title || id, text });
  }
  return out;
}

function mergeSections(
  base: GenSection[],
  incoming: GenSection[],
): GenSection[] {
  const byId = new Map(base.map((s) => [s.id, s]));
  for (const s of incoming) byId.set(s.id, s);
  return [...byId.values()];
}

async function invokeEdge(
  supabaseUrl: string,
  serviceKey: string,
  functionName: string,
  body: Record<string, unknown>,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, prewarm_user_id: userId }),
  });
  if (!res.ok) {
    console.warn("[bazi-prewarm]", functionName, res.status);
    return null;
  }
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function invokeBatTu(
  supabaseUrl: string,
  serviceKey: string,
  op: string,
  query: Record<string, unknown>,
  userId: string,
): Promise<unknown | null> {
  const res = await fetch(`${supabaseUrl}/functions/v1/bat-tu`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      op,
      body: query,
      prewarm_user_id: userId,
    }),
  });
  if (!res.ok) {
    console.warn("[bazi-prewarm] bat-tu", op, res.status);
    return null;
  }
  try {
    const json = (await res.json()) as { data?: unknown };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function deliveryLooksComplete(
  sections: GenSection[],
): boolean {
  const menh = sections.find((s) => s.id === "menh_tong_quan")?.text ?? "";
  if (menh.length < 600) return false;
  const traits = sections.filter((s) => s.id.startsWith("tinh_cach_trait_"));
  if (traits.length < 2) return false;
  const life = sections.filter((s) => s.id.startsWith("luu_nien_life_"));
  if (life.length < 2) return false;
  return sections.length >= 6;
}

export async function runBaziReadingPrewarm(
  admin: SupabaseClient,
  userId: string,
  flowYear?: number,
): Promise<{ ok: boolean; skipped?: boolean; reason?: string }> {
  const year = flowYear ?? currentYearVn();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, reason: "config" };
  }

  if (!(await userHasBaziReadingAccess(admin, userId))) {
    return { ok: false, reason: "locked" };
  }

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("ngay_sinh, gio_sinh, gioi_tinh, birth_data_locked_at, la_so")
    .eq("id", userId)
    .maybeSingle();

  if (profErr || !profile) {
    return { ok: false, reason: "profile" };
  }

  const p = profile as PrewarmProfileRow;
  const birthRevision = baziReadingBirthRevision(p);
  const existing = await loadBaziReadingDeliveryRow(admin, userId, year);
  if (
    existing &&
    existing.birth_revision === birthRevision &&
    existing.content_version === BAZI_READING_DELIVERY_CONTENT_VERSION &&
    deliveryLooksComplete(existing.sections)
  ) {
    return { ok: true, skipped: true, reason: "complete" };
  }

  const person = profileToBatTuPersonQuery(p);
  if (!person.birth_date) {
    return { ok: false, reason: "birth" };
  }

  console.info("[bazi-prewarm] start", userId, year);

  const lasoData = await invokeBatTu(supabaseUrl, serviceKey, "la-so", person, userId);
  if (!lasoData) {
    return { ok: false, reason: "la-so" };
  }

  const luuNienFacts = await invokeBatTu(
    supabaseUrl,
    serviceKey,
    "la-so-luu-nien",
    { ...person, year },
    userId,
  );
    const phongThuyFacts = await invokeBatTu(
      supabaseUrl,
      serviceKey,
      "phong-thuy",
      { ...person, year, purpose: "NHA_O", detail: "full" },
      userId,
    );

  let sections: GenSection[] = [];

  const menhGen = await invokeEdge(
    supabaseUrl,
    serviceKey,
    "generate-reading-la-so",
    { endpoint: "la-so-chi-tiet", data: lasoData, preview: true },
    userId,
  );
  sections = mergeSections(sections, parseSections(menhGen));

  await sleep(STAGGER_MS);

  const tinhGen = await invokeEdge(
    supabaseUrl,
    serviceKey,
    "generate-reading-la-so",
    {
      endpoint: "la-so-chi-tiet",
      data: lasoData,
      only_tinh_cach: true,
    },
    userId,
  );
  sections = mergeSections(sections, parseSections(tinhGen));

  if (luuNienFacts) {
    const lifeGen = await invokeEdge(
      supabaseUrl,
      serviceKey,
      "generate-reading-luu-nien",
      {
        endpoint: "luu-nien",
        data: luuNienFacts,
        only_luu_nien_life: true,
      },
      userId,
    );
    sections = mergeSections(sections, parseSections(lifeGen));

    await sleep(STAGGER_MS);

    const coreGen = await invokeEdge(
      supabaseUrl,
      serviceKey,
      "generate-reading-luu-nien",
      {
        endpoint: "luu-nien",
        data: luuNienFacts,
        only_luu_nien_core: true,
      },
      userId,
    );
    sections = mergeSections(sections, parseSections(coreGen));
  }

  if (phongThuyFacts) {
    await sleep(STAGGER_MS);
    const ptGen = await invokeEdge(
      supabaseUrl,
      serviceKey,
      "generate-reading-la-so",
      { endpoint: "phong-thuy", data: phongThuyFacts },
      userId,
    );
    sections = mergeSections(sections, parseSections(ptGen));
  }

  if (!deliveryLooksComplete(sections)) {
    console.warn(
      "[bazi-prewarm] partial",
      userId,
      sections.map((s) => s.id).join(","),
    );
  }

  if (sections.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const yearCanChi =
    typeof (luuNienFacts as Record<string, unknown> | null)?.year_can_chi ===
        "string"
      ? String((luuNienFacts as Record<string, unknown>).year_can_chi)
      : "";

  const saved = await upsertBaziReadingDelivery(admin, {
    userId,
    flowYear: year,
    birthRevision,
    contentVersion: BAZI_READING_DELIVERY_CONTENT_VERSION,
    sections,
    laSoDisplay: p.la_so ?? null,
    luuNienFacts: luuNienFacts ?? null,
    phongThuyFacts: phongThuyFacts ?? null,
    yearCanChi,
  });

  if (!saved.ok) {
    return { ok: false, reason: "persist" };
  }

  console.info("[bazi-prewarm] done", userId, sections.length);
  return { ok: true };
}
