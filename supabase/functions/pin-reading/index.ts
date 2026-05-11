/**
 * Pin or unpin an AI reading section for the authenticated user.
 * POST body: { scope, day_iso, section?, reading_snapshot?, action: "pin"|"unpin" }
 * Idempotent: pin when not pinned, unpin when pinned.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error_code: "METHOD_NOT_ALLOWED" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ ok: false, error_code: "SERVER_CONFIG" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error_code: "UNAUTHORIZED" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json({ ok: false, error_code: "UNAUTHORIZED" }, 401);
  }

  let body: { scope?: unknown; day_iso?: unknown; section?: unknown; reading_snapshot?: unknown; action?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error_code: "BAD_REQUEST", message: "JSON không hợp lệ." }, 400);
  }

  const scope = typeof body.scope === "string" ? body.scope.trim() : "";
  const dayIso = typeof body.day_iso === "string" ? body.day_iso.trim() : "";
  const section = typeof body.section === "string" ? body.section.trim() : "all";
  const action = typeof body.action === "string" ? body.action.trim() : "pin";
  const readingSnapshot = typeof body.reading_snapshot === "string"
    ? body.reading_snapshot.slice(0, 20000)
    : null;

  if (!scope) {
    return json({ ok: false, error_code: "BAD_REQUEST", message: "scope là bắt buộc." }, 400);
  }
  if (!ISO_DAY.test(dayIso)) {
    return json({ ok: false, error_code: "BAD_REQUEST", message: "day_iso cần dạng YYYY-MM-DD." }, 400);
  }
  if (action !== "pin" && action !== "unpin") {
    return json({ ok: false, error_code: "BAD_REQUEST", message: "action phải là pin hoặc unpin." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  if (action === "unpin") {
    const { error } = await admin
      .from("pinned_readings")
      .delete()
      .eq("user_id", user.id)
      .eq("scope", scope)
      .eq("day_iso", dayIso)
      .eq("section", section);

    if (error) {
      console.error("pin-reading unpin error", error);
      return json({ ok: false, error_code: "DB_ERROR" }, 500);
    }
    return json({ ok: true, pinned: false });
  }

  // action === "pin"
  const { error } = await admin
    .from("pinned_readings")
    .upsert(
      {
        user_id: user.id,
        scope,
        day_iso: dayIso,
        section,
        reading_snapshot: readingSnapshot,
        pinned_at: new Date().toISOString(),
      },
      { onConflict: "user_id,scope,day_iso,section" },
    );

  if (error) {
    console.error("pin-reading pin error", error);
    return json({ ok: false, error_code: "DB_ERROR" }, 500);
  }

  return json({ ok: true, pinned: true });
});
