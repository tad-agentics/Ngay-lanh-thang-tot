import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { baziReadingDeliveryIsComplete } from "../../../../shared/bazi-reading-delivery-complete.ts";
import {
  BAZI_READING_DELIVERY_CONTENT_VERSION,
  loadBaziReadingDeliveryRow,
  upsertBaziReadingDelivery,
} from "../bazi-reading-delivery.ts";
import { runBaziGenerateBundle, type GenerateInvokeResult } from "../bazi-reading-generate-bundle.ts";
import { userHasBaziReadingAccess } from "../bazi-reading-gate.ts";
import { redisDelKey, redisSetNxEx } from "../redis-cache.ts";
import {
  baziReadingBirthRevision,
  currentYearVn,
  profileToBatTuPersonQuery,
  type PrewarmProfileRow,
} from "./profile-bat-tu.ts";

const PREWARM_LOCK_TTL_SEC = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSections(json: Record<string, unknown> | null) {
  if (!json) return [];
  const raw = json.sections;
  if (!Array.isArray(raw)) return [];
  const out: { id: string; title: string; text: string }[] = [];
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

async function invokeEdge(
  supabaseUrl: string,
  serviceKey: string,
  functionName: string,
  body: Record<string, unknown>,
  userId: string,
): Promise<{ json: Record<string, unknown> | null; status: number }> {
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
    return { json: null, status: res.status };
  }
  try {
    return { json: (await res.json()) as Record<string, unknown>, status: res.status };
  } catch {
    return { json: null, status: res.status };
  }
}

const GENERATE_RETRY_MS = 11_000;
const GENERATE_RETRY_STATUSES = new Set([502, 503, 504]);

async function invokeGenerateWithRetry(
  supabaseUrl: string,
  serviceKey: string,
  functionName: string,
  body: Record<string, unknown>,
  userId: string,
): Promise<GenerateInvokeResult | null> {
  let result = await invokeEdge(supabaseUrl, serviceKey, functionName, body, userId);
  if (
    !result.json &&
    GENERATE_RETRY_STATUSES.has(result.status)
  ) {
    await sleep(GENERATE_RETRY_MS);
    result = await invokeEdge(supabaseUrl, serviceKey, functionName, body, userId);
  }
  if (!result.json) return null;
  return {
    sections: parseSections(result.json),
    reading: typeof result.json.reading === "string" ? result.json.reading : null,
  };
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
    baziReadingDeliveryIsComplete(existing.sections, {
      luuNienFactsRaw: existing.luu_nien_facts,
      phongThuyFactsRaw: existing.phong_thuy_facts,
    })
  ) {
    return { ok: true, skipped: true, reason: "complete" };
  }

  const person = profileToBatTuPersonQuery(p);
  if (!person.birth_date) {
    return { ok: false, reason: "birth" };
  }

  const lockKey = `prewarm:lock:v1:${userId}:${year}`;
  const lockAcquired = await redisSetNxEx(lockKey, "1", PREWARM_LOCK_TTL_SEC);
  if (!lockAcquired) {
    return { ok: true, skipped: true, reason: "locked" };
  }

  console.info("[bazi-prewarm] start", userId, year);

  try {
    const bundle = await runBaziGenerateBundle({
      person,
      year,
      ports: {
        invokeBatTu: (op, query) =>
          invokeBatTu(supabaseUrl, serviceKey, op, query, userId),
        invokeGenerate: async (functionName, body) => {
          const out = await invokeGenerateWithRetry(
            supabaseUrl,
            serviceKey,
            functionName,
            body,
            userId,
          );
          return out;
        },
        invokeGenerateWithRetry: async (functionName, body) =>
          invokeGenerateWithRetry(
            supabaseUrl,
            serviceKey,
            functionName,
            body,
            userId,
          ),
        sleep,
      },
    });

    if (!bundle || bundle.sections.length === 0) {
      return { ok: false, reason: "empty" };
    }

    if (!bundle.complete) {
      console.warn(
        "[bazi-prewarm] partial",
        userId,
        bundle.sections.map((s) => s.id).join(","),
      );
      return { ok: false, reason: "partial" };
    }

    const yearCanChi =
      typeof (bundle.luuNienFacts as Record<string, unknown> | null)
          ?.year_can_chi === "string"
        ? String((bundle.luuNienFacts as Record<string, unknown>).year_can_chi)
        : "";

    const saved = await upsertBaziReadingDelivery(admin, {
      userId,
      flowYear: year,
      birthRevision,
      contentVersion: BAZI_READING_DELIVERY_CONTENT_VERSION,
      sections: bundle.sections,
      laSoDisplay: p.la_so ?? null,
      luuNienFacts: bundle.luuNienFacts,
      phongThuyFacts: bundle.phongThuyFacts,
      yearCanChi,
    });

    if (!saved.ok) {
      return { ok: false, reason: "persist" };
    }

    console.info("[bazi-prewarm] done", userId, bundle.sections.length);
    return { ok: true };
  } finally {
    if (lockAcquired) {
      await redisDelKey(lockKey);
    }
  }
}
