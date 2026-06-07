/**
 * Server-stored day luận follow-up threads (phương án B).
 * - open: freeze luan_context + anchor; return thread_id + prior messages
 * - ask: idempotent append Q/A + LLM (client idempotency_key per submit)
 * - cta_click: admin engagement — user bấm CTA "Hỏi tiếp về ngày này"
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import {
  appendThreadTurns,
  findCachedAnswerInMessages,
  followUpRemaining,
  freezeLuanContext,
  mergeAnchorReading,
  parseBirthRevision,
  parseDayIso,
  parseIdempotencyKey,
  parseStoredMessages,
  parseThreadUuid,
} from "../_shared/day-luan-thread.ts";
import { todayIsoVietnam } from "../_shared/generate-reading/core/dates.ts";
import {
  acquireGenerateReadingRateLimit,
  preflightAiReadingAccess,
} from "../_shared/generate-reading-guards.ts";
import { trackProfileEngagement } from "../_shared/user-engagement.ts";
import { stableStringify } from "../_shared/generate-reading/core/cache.ts";
import {
  DAY_DETAIL_REQUEST_TIMEOUT_MS,
  READING_MAX_TOKENS_DAY_DETAIL_FOLLOW_UP,
} from "../_shared/generate-reading/core/config.ts";
import { llmChat } from "../_shared/generate-reading/core/llm.ts";
import { buildDayDetailFollowUpMessages } from "../_shared/generate-reading/core/thread-history.ts";
import { DAY_DETAIL_FOLLOW_UP_SYSTEM } from "../_shared/generate-reading/prompts/day.ts";

const PENDING_STALE_MS = 120_000;

type AdminClient = ReturnType<typeof createClient>;

async function fetchDailyCount(
  admin: AdminClient,
  userId: string,
  vnDate: string,
): Promise<number> {
  const { data, error } = await admin.rpc("get_day_luan_daily_count", {
    p_user: userId,
    p_vn_date: vnDate,
  });
  if (error) {
    console.error("get_day_luan_daily_count", error.message);
    return 0;
  }
  return typeof data === "number" && Number.isFinite(data) ? data : 0;
}

async function tryIncrementDaily(
  admin: AdminClient,
  userId: string,
  vnDate: string,
): Promise<{ count: number; limited: boolean }> {
  const { data, error } = await admin.rpc("increment_day_luan_daily", {
    p_user: userId,
    p_vn_date: vnDate,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    console.error("increment_day_luan_daily", error?.message);
    const count = await fetchDailyCount(admin, userId, vnDate);
    return { count, limited: true };
  }
  const rec = data as Record<string, unknown>;
  const count =
    typeof rec.count === "number" && Number.isFinite(rec.count) ? rec.count : 0;
  return { count, limited: rec.limited === true };
}

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}

type ThreadRow = {
  id: string;
  user_id: string;
  day_iso: string;
  birth_revision: string;
  luan_context: unknown;
  anchor_reading: string;
  messages: unknown;
  follow_up_count: number;
};

type IdempotencyRow = {
  id: string;
  thread_id: string;
  idempotency_key: string;
  question: string;
  answer: string | null;
  status: string;
  created_at: string;
};

function askSuccessPayload(globalDailyCount: number, answer: string) {
  return {
    ok: true,
    answer,
    follow_up_count: globalDailyCount,
    follow_up_remaining: followUpRemaining(globalDailyCount),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersForRequest(req) });
  }

  if (req.method !== "POST") {
    return json(
      { ok: false, error_code: "METHOD_NOT_ALLOWED", message: "POST only." },
      405,
      req,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(
      { ok: false, error_code: "SERVER_CONFIG", message: "Server not configured." },
      500,
      req,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(
      { ok: false, error_code: "UNAUTHORIZED", message: "Authorization required." },
      401,
      req,
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json(
      { ok: false, error_code: "UNAUTHORIZED", message: "Invalid session." },
      401,
      req,
    );
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

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const admin = createClient(supabaseUrl, serviceKey);

  if (action === "cta_click") {
    trackProfileEngagement(admin, user.id, "day_luan_follow_up");
    return json({ ok: true }, 200, req);
  }

  if (action === "quota") {
    const vnToday = todayIsoVietnam();
    const globalCount = await fetchDailyCount(admin, user.id, vnToday);
    return json(
      {
        ok: true,
        follow_up_count: globalCount,
        follow_up_remaining: followUpRemaining(globalCount),
      },
      200,
      req,
    );
  }

  if (action === "open") {
    const dayIso = parseDayIso(body.day_iso);
    if (!dayIso) {
      return json(
        {
          ok: false,
          error_code: "BAD_REQUEST",
          message: "day_iso cần dạng YYYY-MM-DD.",
        },
        400,
        req,
      );
    }

    const preflight = await preflightAiReadingAccess(
      admin,
      user.id,
      "day_detail",
      dayIso,
    );
    if (!preflight.allowed) {
      return json(
        {
          ok: false,
          error_code: "NOT_UNLOCKED",
          message: "Cần mở luận giải ngày trước.",
        },
        403,
        req,
      );
    }

    const birthRevision = parseBirthRevision(body.birth_revision);
    const luanContextRaw = body.luan_context_raw ?? body.luan_context;
    if (luanContextRaw === undefined || luanContextRaw === null) {
      return json(
        {
          ok: false,
          error_code: "BAD_REQUEST",
          message: "Thiếu luan_context_raw.",
        },
        400,
        req,
      );
    }

    const frozen = freezeLuanContext(luanContextRaw);
    const frozenJson = stableStringify(frozen);
    const anchorIncoming = body.anchor_reading;

    const { data: existing, error: selErr } = await admin
      .from("day_luan_threads")
      .select(
        "id, user_id, day_iso, birth_revision, luan_context, anchor_reading, messages, follow_up_count",
      )
      .eq("user_id", user.id)
      .eq("day_iso", dayIso)
      .eq("birth_revision", birthRevision)
      .maybeSingle();

    if (selErr) {
      console.error("day-luan-chat open select", selErr.message);
      return json(
        { ok: false, error_code: "DB_ERROR", message: "Không mở được hội thoại." },
        500,
        req,
      );
    }

    const now = new Date().toISOString();
    let row: ThreadRow;

    if (existing) {
      const anchor = mergeAnchorReading(
        String(existing.anchor_reading ?? ""),
        anchorIncoming,
      );
      const updates: Record<string, unknown> = {
        anchor_reading: anchor,
        updated_at: now,
      };
      const existingJson = stableStringify(existing.luan_context);
      if (existingJson !== frozenJson) {
        updates.luan_context = frozen;
      }

      const { data: updated, error: updErr } = await admin
        .from("day_luan_threads")
        .update(updates)
        .eq("id", existing.id)
        .select(
          "id, user_id, day_iso, birth_revision, luan_context, anchor_reading, messages, follow_up_count",
        )
        .single();

      if (updErr || !updated) {
        console.error("day-luan-chat open update", updErr?.message);
        return json(
          { ok: false, error_code: "DB_ERROR", message: "Không mở được hội thoại." },
          500,
          req,
        );
      }
      row = updated as ThreadRow;
    } else {
      const anchor = mergeAnchorReading("", anchorIncoming);
      const { data: inserted, error: insErr } = await admin
        .from("day_luan_threads")
        .insert({
          user_id: user.id,
          day_iso: dayIso,
          birth_revision: birthRevision,
          luan_context: frozen,
          anchor_reading: anchor,
          messages: [],
          follow_up_count: 0,
          updated_at: now,
        })
        .select(
          "id, user_id, day_iso, birth_revision, luan_context, anchor_reading, messages, follow_up_count",
        )
        .single();

      if (insErr || !inserted) {
        console.error("day-luan-chat open insert", insErr?.message);
        return json(
          { ok: false, error_code: "DB_ERROR", message: "Không mở được hội thoại." },
          500,
          req,
        );
      }
      row = inserted as ThreadRow;
    }

    const messages = parseStoredMessages(row.messages);
    const vnToday = todayIsoVietnam();
    const globalCount = await fetchDailyCount(admin, user.id, vnToday);
    return json(
      {
        ok: true,
        thread_id: row.id,
        follow_up_count: globalCount,
        follow_up_remaining: followUpRemaining(globalCount),
        messages,
      },
      200,
      req,
    );
  }

  if (action === "ask") {
    const threadId = parseThreadUuid(body.thread_id);
    const idempotencyKey = parseIdempotencyKey(body.idempotency_key);
    const question =
      typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";

    if (!threadId) {
      return json(
        { ok: false, error_code: "BAD_REQUEST", message: "thread_id không hợp lệ." },
        400,
        req,
      );
    }
    if (!idempotencyKey) {
      return json(
        {
          ok: false,
          error_code: "BAD_REQUEST",
          message: "Thiếu idempotency_key (8–64 ký tự).",
        },
        400,
        req,
      );
    }
    if (!question) {
      return json(
        { ok: false, error_code: "BAD_REQUEST", message: "Nhập câu hỏi." },
        400,
        req,
      );
    }

    const { data: thread, error: threadErr } = await admin
      .from("day_luan_threads")
      .select(
        "id, user_id, day_iso, birth_revision, luan_context, anchor_reading, messages, follow_up_count",
      )
      .eq("id", threadId)
      .maybeSingle();

    if (threadErr || !thread) {
      return json(
        { ok: false, error_code: "THREAD_NOT_FOUND", message: "Không tìm thấy hội thoại." },
        404,
        req,
      );
    }

    if (thread.user_id !== user.id) {
      return json(
        { ok: false, error_code: "FORBIDDEN", message: "Không có quyền." },
        403,
        req,
      );
    }

    const dayIso = String(thread.day_iso ?? "");
    const preflight = await preflightAiReadingAccess(
      admin,
      user.id,
      "day_detail",
      dayIso,
    );
    if (!preflight.allowed) {
      return json(
        {
          ok: false,
          error_code: "NOT_UNLOCKED",
          message: "Cần mở luận giải ngày trước.",
        },
        403,
        req,
      );
    }

    let count = (thread.follow_up_count as number) ?? 0;
    const vnToday = todayIsoVietnam();

    const { data: existingIdem } = await admin
      .from("day_luan_ask_idempotency")
      .select("id, thread_id, idempotency_key, question, answer, status, created_at")
      .eq("thread_id", threadId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    const idem = existingIdem as IdempotencyRow | null;
    if (idem?.status === "done" && idem.answer?.trim()) {
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(askSuccessPayload(globalCount, idem.answer.trim()), 200, req);
    }

    const storedMessages = parseStoredMessages(thread.messages);
    const cachedInThread = findCachedAnswerInMessages(storedMessages, question);
    if (cachedInThread) {
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(askSuccessPayload(globalCount, cachedInThread), 200, req);
    }

    const now = new Date().toISOString();

    if (idem?.status === "pending") {
      const age = Date.now() - new Date(idem.created_at).getTime();
      if (age < PENDING_STALE_MS) {
        return json(
          {
            ok: false,
            error_code: "IN_PROGRESS",
            message: "Đang xử lý câu hỏi này. Đợi vài giây rồi thử lại.",
          },
          409,
          req,
        );
      }
      await admin
        .from("day_luan_ask_idempotency")
        .update({ status: "failed", updated_at: now })
        .eq("id", idem.id);
    }

    if (!idem) {
      const { error: insIdemErr } = await admin
        .from("day_luan_ask_idempotency")
        .insert({
          thread_id: threadId,
          idempotency_key: idempotencyKey,
          question,
          status: "pending",
          updated_at: now,
        });

      if (insIdemErr) {
        const { data: raced } = await admin
          .from("day_luan_ask_idempotency")
          .select("answer, status, created_at")
          .eq("thread_id", threadId)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (raced?.status === "done" && typeof raced.answer === "string" &&
          raced.answer.trim()) {
          const globalCount = await fetchDailyCount(admin, user.id, vnToday);
          return json(askSuccessPayload(globalCount, raced.answer.trim()), 200, req);
        }
        if (raced?.status === "pending") {
          const age = Date.now() - new Date(raced.created_at as string).getTime();
          if (age < PENDING_STALE_MS) {
            return json(
              {
                ok: false,
                error_code: "IN_PROGRESS",
                message: "Đang xử lý câu hỏi này. Đợi vài giây rồi thử lại.",
              },
              409,
              req,
            );
          }
        }
      }
    } else if (idem.status === "failed") {
      await admin
        .from("day_luan_ask_idempotency")
        .update({
          question,
          status: "pending",
          answer: null,
          updated_at: now,
        })
        .eq("id", idem.id);
    }

    const inc = await tryIncrementDaily(admin, user.id, vnToday);
    if (inc.limited) {
      return json(
        {
          ok: false,
          error_code: "DAILY_LIMIT",
          message: "Hết lượt hỏi hôm nay.",
          follow_up_count: inc.count,
          follow_up_remaining: 0,
        },
        429,
        req,
      );
    }

    const slot = await acquireGenerateReadingRateLimit(user.id, {
      followUp: true,
    });
    if (!slot) {
      return json(
        {
          ok: false,
          error_code: "RATE_LIMITED",
          message: "Đợi vài giây rồi thử lại.",
        },
        429,
        req,
      );
    }

    const history = storedMessages;
    const anchor = String(thread.anchor_reading ?? "");
    const chatMessages = buildDayDetailFollowUpMessages(
      DAY_DETAIL_FOLLOW_UP_SYSTEM,
      thread.luan_context,
      anchor,
      history,
      question,
    );

    const answer = await llmChat(
      chatMessages,
      READING_MAX_TOKENS_DAY_DETAIL_FOLLOW_UP,
      DAY_DETAIL_REQUEST_TIMEOUT_MS,
      { profile: "flash", disableThinking: true },
    );

    const trimmed = answer?.trim() ?? "";

    if (!trimmed) {
      await admin
        .from("day_luan_ask_idempotency")
        .update({ status: "failed", updated_at: now })
        .eq("thread_id", threadId)
        .eq("idempotency_key", idempotencyKey);
      return json(
        {
          ok: false,
          error_code: "LLM_EMPTY",
          message:
            "Chưa nhận được câu trả lời. Đợi vài giây rồi thử lại, hoặc kiểm tra mạng.",
        },
        502,
        req,
      );
    }

    await admin
      .from("day_luan_ask_idempotency")
      .update({
        answer: trimmed,
        status: "done",
        updated_at: now,
      })
      .eq("thread_id", threadId)
      .eq("idempotency_key", idempotencyKey);

    const nextMessages = appendThreadTurns(history, question, trimmed);
    const nextCount = count + 1;

    const { data: updated, error: updErr } = await admin
      .from("day_luan_threads")
      .update({
        messages: nextMessages,
        follow_up_count: nextCount,
        updated_at: now,
      })
      .eq("id", threadId)
      .eq("follow_up_count", count)
      .select("follow_up_count, messages")
      .maybeSingle();

    if (!updErr && updated) {
      return json(askSuccessPayload(inc.count, trimmed), 200, req);
    }

    console.warn("day-luan-chat ask thread update race", updErr?.message);

    const { data: reloaded } = await admin
      .from("day_luan_threads")
      .select("follow_up_count, messages")
      .eq("id", threadId)
      .maybeSingle();

    const reloadedMessages = parseStoredMessages(reloaded?.messages);
    const recovered = findCachedAnswerInMessages(reloadedMessages, question);
    if (recovered) {
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(askSuccessPayload(globalCount, recovered), 200, req);
    }

    const { data: idemAfter } = await admin
      .from("day_luan_ask_idempotency")
      .select("answer, status")
      .eq("thread_id", threadId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (idemAfter?.status === "done" && typeof idemAfter.answer === "string") {
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(
        askSuccessPayload(globalCount, idemAfter.answer.trim()),
        200,
        req,
      );
    }

    return json(
      {
        ok: false,
        error_code: "CONFLICT",
        message: "Thử gửi lại câu hỏi.",
      },
      409,
      req,
    );
  }

  return json(
    {
      ok: false,
      error_code: "BAD_REQUEST",
      message: 'action phải là "open", "ask" hoặc "cta_click".',
    },
    400,
    req,
  );
});
