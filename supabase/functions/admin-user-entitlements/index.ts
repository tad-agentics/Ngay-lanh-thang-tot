/**
 * Admin PATCH user entitlements — JWT + ADMIN_EMAILS.
 *
 * PATCH / POST body:
 * {
 *   userId: string,
 *   subscriptionExpiresAt?: string | null,
 *   baziReadingUnlock?: boolean,
 *   tieuVanExpiresAt?: string | null,
 *   adminNote: string
 * }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import { adminJson, isUuid, requireAdmin } from "../_shared/admin-auth.ts";

const MAX_NOTE_LEN = 500;

function parseIsoDate(
  value: unknown,
  label: string,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (value === null) return { ok: true, value: null };
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, message: `${label} must be ISO string or null` };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, message: `${label} is not a valid date` };
  }
  return { ok: true, value: d.toISOString() };
}

type PatchBody = {
  userId?: string;
  subscriptionExpiresAt?: string | null;
  baziReadingUnlock?: boolean;
  tieuVanExpiresAt?: string | null;
  adminNote?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeadersForRequest(req),
        "Access-Control-Allow-Methods": "PATCH, POST, OPTIONS",
      },
    });
  }

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { admin, email, userId: adminUserId, cors } = auth;

  if (req.method !== "PATCH" && req.method !== "POST") {
    return adminJson(
      cors,
      { error: { code: "METHOD_NOT_ALLOWED", message: "PATCH/POST only" } },
      405,
    );
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return adminJson(
      cors,
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      400,
    );
  }

  const targetId = body.userId?.trim();
  if (!targetId || !isUuid(targetId)) {
    return adminJson(
      cors,
      { error: { code: "BAD_REQUEST", message: "userId must be a UUID" } },
      400,
    );
  }

  const note = typeof body.adminNote === "string" ? body.adminNote.trim() : "";
  if (!note || note.length > MAX_NOTE_LEN) {
    return adminJson(
      cors,
      {
        error: {
          code: "BAD_REQUEST",
          message: `adminNote is required (max ${MAX_NOTE_LEN} chars)`,
        },
      },
      400,
    );
  }

  const hasSub = "subscriptionExpiresAt" in body;
  const hasBazi = typeof body.baziReadingUnlock === "boolean";
  const hasTv = "tieuVanExpiresAt" in body;

  if (!hasSub && !hasBazi && !hasTv) {
    return adminJson(
      cors,
      {
        error: {
          code: "BAD_REQUEST",
          message:
            "Provide at least one of subscriptionExpiresAt, baziReadingUnlock, tieuVanExpiresAt",
        },
      },
      400,
    );
  }

  try {
    const { data: before, error: fetchErr } = await admin
      .from("profiles")
      .select(
        "id, email, credits_balance, subscription_expires_at, bazi_reading_unlocked_at, tieu_van_reading_expires_at",
      )
      .eq("id", targetId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!before) {
      return adminJson(
        cors,
        { error: { code: "NOT_FOUND", message: "User not found" } },
        404,
      );
    }

    const patch: Record<string, string | null> = {};
    const changes: Record<string, unknown> = {};

    if (hasSub) {
      const parsed = parseIsoDate(
        body.subscriptionExpiresAt,
        "subscriptionExpiresAt",
      );
      if (!parsed.ok) {
        return adminJson(
          cors,
          { error: { code: "BAD_REQUEST", message: parsed.message } },
          400,
        );
      }
      patch.subscription_expires_at = parsed.value;
      changes.subscription_expires_at = {
        from: before.subscription_expires_at,
        to: parsed.value,
      };
    }

    if (hasBazi) {
      const now = new Date().toISOString();
      if (body.baziReadingUnlock) {
        patch.bazi_reading_unlocked_at = before.bazi_reading_unlocked_at ?? now;
      } else {
        patch.bazi_reading_unlocked_at = null;
      }
      changes.bazi_reading_unlocked_at = {
        from: before.bazi_reading_unlocked_at,
        to: patch.bazi_reading_unlocked_at,
      };
    }

    if (hasTv) {
      const parsed = parseIsoDate(body.tieuVanExpiresAt, "tieuVanExpiresAt");
      if (!parsed.ok) {
        return adminJson(
          cors,
          { error: { code: "BAD_REQUEST", message: parsed.message } },
          400,
        );
      }
      patch.tieu_van_reading_expires_at = parsed.value;
      changes.tieu_van_reading_expires_at = {
        from: before.tieu_van_reading_expires_at,
        to: parsed.value,
      };
    }

    const { data: updated, error: updateErr } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", targetId)
      .select(
        "id, email, subscription_expires_at, bazi_reading_unlocked_at, tieu_van_reading_expires_at",
      )
      .single();

    if (updateErr) throw updateErr;

    const idempotencyKey = `admin_ent:${targetId}:${Date.now()}`;
    const { error: ledgerErr } = await admin.from("credit_ledger").insert({
      user_id: targetId,
      delta: 0,
      balance_after: before.credits_balance ?? 0,
      reason: "admin_entitlement_adjustment",
      idempotency_key: idempotencyKey,
      metadata: {
        admin_email: email,
        admin_user_id: adminUserId,
        admin_note: note,
        changes,
      },
    });

    if (ledgerErr && (ledgerErr as { code?: string }).code !== "23505") {
      console.error("admin-user-entitlements ledger", ledgerErr);
    }

    return adminJson(cors, {
      ok: true,
      profile: updated,
      auditedBy: email,
    });
  } catch (e) {
    console.error("admin-user-entitlements", e);
    return adminJson(
      cors,
      {
        error: {
          code: "INTERNAL",
          message: e instanceof Error ? e.message : "Update failed",
        },
      },
      500,
    );
  }
});
