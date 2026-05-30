/**
 * Lưu Luận giải Bát Tự full đã mua — service_role upsert; đọc qua RLS từ client.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import {
  normalizeDeliverySections,
  upsertBaziReadingDelivery,
} from "../_shared/bazi-reading-delivery.ts";
import { userHasBaziReadingAccess } from "../_shared/bazi-reading-gate.ts";

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersForRequest(req) });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error_code: "METHOD_NOT_ALLOWED" }, 405, req);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ ok: false, error_code: "SERVER_CONFIG" }, 500, req);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error_code: "UNAUTHORIZED" }, 401, req);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const uid = userData?.user?.id;
  if (userErr || !uid) {
    return json({ ok: false, error_code: "UNAUTHORIZED" }, 401, req);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const allowed = await userHasBaziReadingAccess(admin, uid);
  if (!allowed) {
    return json({ ok: false, error_code: "BAZI_READING_LOCKED" }, 403, req);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(
      { ok: false, error_code: "BAD_REQUEST", message: "JSON không hợp lệ." },
      400,
      req,
    );
  }

  const flowYear = typeof body.flow_year === "number"
    ? body.flow_year
    : Number(body.flow_year);
  const birthRevision =
    typeof body.birth_revision === "string" ? body.birth_revision : "";
  const contentVersion =
    typeof body.content_version === "string" ? body.content_version : "";
  const yearCanChi =
    typeof body.year_can_chi === "string" ? body.year_can_chi : "";

  const sections = normalizeDeliverySections(body.sections);
  if (!sections?.length) {
    return json(
      { ok: false, error_code: "BAD_REQUEST", message: "sections rỗng." },
      400,
      req,
    );
  }

  const result = await upsertBaziReadingDelivery(admin, {
    userId: uid,
    flowYear,
    birthRevision,
    contentVersion,
    sections,
    laSoDisplay: body.la_so_display ?? null,
    luuNienFacts: body.luu_nien_facts ?? null,
    phongThuyFacts: body.phong_thuy_facts ?? null,
    yearCanChi,
  });

  if (!result.ok) {
    return json(
      { ok: false, error_code: "SAVE_FAILED", message: result.message },
      500,
      req,
    );
  }

  return json({ ok: true }, 200, req);
});
