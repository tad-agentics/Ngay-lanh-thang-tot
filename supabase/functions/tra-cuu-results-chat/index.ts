/**
 * Tra cứu results-screen chat — multi-turn on chon-ngay pick list.
 * - open: freeze pick_context + intro anchor
 * - ask: intent parse (JSON) → answer | change_task | open_day
 * Shares global day_luan_daily_usage quota with day-luan-chat.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import {
  followUpRemaining,
  parseBirthRevision,
  parseIdempotencyKey,
  parseThreadUuid,
} from "../_shared/day-luan-thread.ts";
import {
  acquireGenerateReadingRateLimit,
  subscriptionActiveForReading,
} from "../_shared/generate-reading-guards.ts";
import { hasOnboardingTrialAccess } from "../_shared/entitlements.ts";
import {
  finalizeOnboardingTrialConsume,
  readOnboardingTrialQuestionsMax,
  shouldConsumeTrialQuestion,
} from "../_shared/onboarding-trial.ts";
import { todayIsoVietnam } from "../_shared/generate-reading/core/dates.ts";
import { stableStringify } from "../_shared/generate-reading/core/cache.ts";
import { llmChat } from "../_shared/generate-reading/core/llm.ts";
import {
  DAY_DETAIL_REQUEST_TIMEOUT_MS,
  READING_MAX_TOKENS_DAY_DETAIL_FOLLOW_UP,
} from "../_shared/generate-reading/core/config.ts";
import { TRA_CUU_RESULTS_INTENT_PARSE_SYSTEM } from "../_shared/generate-reading/prompts/tra-cuu.ts";
import {
  buildTraCuuResultsPickContext,
  buildTraCuuSessionKey,
  type TraCuuResultsPickMeta,
} from "../_shared/tra-cuu-results-context.ts";
import {
  appendTraCuuThreadTurns,
  buildTraCuuResultsFollowUpMessages,
  parseStoredTraCuuMessages,
  parseTraCuuIntentLlmJson,
} from "../_shared/tra-cuu-results-thread.ts";
import { findCachedAnswerInMessages as findCachedAnswer } from "../_shared/day-luan-thread.ts";
import {
  type AdminClient,
  fetchDailyCount,
  refundDailyQuota,
  tryIncrementDaily,
} from "../_shared/day-luan-daily-quota.ts";

const PENDING_STALE_MS = 120_000;
const PARSE_MAX_TOKENS = 280;

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}

async function preflightTraCuuChat(
  admin: AdminClient,
  userId: string,
): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const { data: profile, error } = await admin
    .from("profiles")
    .select("subscription_expires_at, onboarding_trial_questions_used")
    .eq("id", userId)
    .maybeSingle();
  if (error || !profile) {
    return { allowed: false, message: "Không tìm thấy hồ sơ." };
  }
  if (
    subscriptionActiveForReading(
      profile.subscription_expires_at as string | null,
    )
  ) {
    return { allowed: true };
  }
  const trialMax = await readOnboardingTrialQuestionsMax(admin);
  if (hasOnboardingTrialAccess(profile, trialMax)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    message: "Bạn đã dùng hết lượt thử. Đặt lịch để tiếp tục.",
  };
}

function parsePickMeta(body: Record<string, unknown>): TraCuuResultsPickMeta | null {
  const intent = typeof body.intent === "string" ? body.intent.trim() : "";
  const intentLabel =
    typeof body.intent_label === "string" ? body.intent_label.trim() : "";
  const rangeStart =
    typeof body.range_start === "string" ? body.range_start.trim() : "";
  const rangeEnd =
    typeof body.range_end === "string" ? body.range_end.trim() : "";
  if (!intent || !intentLabel || !rangeStart || !rangeEnd) return null;
  return {
    intent,
    intent_label: intentLabel,
    range_start: rangeStart,
    range_end: rangeEnd,
  };
}

function dayInPickContext(
  pickContext: unknown,
  dayIso: string,
): boolean {
  if (!pickContext || typeof pickContext !== "object" || Array.isArray(pickContext)) {
    return false;
  }
  const days = (pickContext as Record<string, unknown>).ranked_days;
  if (!Array.isArray(days)) return false;
  return days.some((d) => {
    if (!d || typeof d !== "object" || Array.isArray(d)) return false;
    return (d as Record<string, unknown>).date_iso === dayIso;
  });
}

type ThreadRow = {
  id: string;
  pick_context: unknown;
  anchor_intro: string;
  messages: unknown;
  follow_up_count: number;
};

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

  const gate = await preflightTraCuuChat(admin, user.id);
  if (!gate.allowed) {
    return json(
      { ok: false, error_code: "SUB_EXPIRED", message: gate.message },
      403,
      req,
    );
  }

  if (action === "open") {
    const meta = parsePickMeta(body);
    const payload = body.chon_ngay_payload ?? body.payload;
    if (!meta || payload === undefined) {
      return json(
        {
          ok: false,
          error_code: "BAD_REQUEST",
          message: "Thiếu intent/range hoặc payload.",
        },
        400,
        req,
      );
    }

    const sessionKey = buildTraCuuSessionKey(meta);
    const birthRevision = parseBirthRevision(body.birth_revision);
    const pickContext = buildTraCuuResultsPickContext(payload, meta);
    const anchorIntro =
      typeof body.anchor_intro === "string" ? body.anchor_intro.trim() : "";

    const { data: existing } = await admin
      .from("tra_cuu_results_threads")
      .select("id, pick_context, anchor_intro, messages, follow_up_count")
      .eq("user_id", user.id)
      .eq("session_key", sessionKey)
      .eq("birth_revision", birthRevision)
      .maybeSingle();

    const vnToday = todayIsoVietnam();
    const globalCount = await fetchDailyCount(admin, user.id, vnToday);

    if (existing) {
      const row = existing as ThreadRow;
      const messages = parseStoredTraCuuMessages(row.messages);
      if (anchorIntro && !row.anchor_intro?.trim()) {
        await admin
          .from("tra_cuu_results_threads")
          .update({
            anchor_intro: anchorIntro,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }
      return json(
        {
          ok: true,
          thread_id: row.id,
          messages,
          follow_up_count: globalCount,
          follow_up_remaining: followUpRemaining(globalCount),
        },
        200,
        req,
      );
    }

    const { data: inserted, error: insErr } = await admin
      .from("tra_cuu_results_threads")
      .insert({
        user_id: user.id,
        session_key: sessionKey,
        birth_revision: birthRevision,
        pick_context: pickContext,
        anchor_intro: anchorIntro,
        messages: [],
      })
      .select("id")
      .single();

    if (insErr || !inserted?.id) {
      return json(
        {
          ok: false,
          error_code: "DB_ERROR",
          message: "Không mở được hội thoại.",
        },
        500,
        req,
      );
    }

    return json(
      {
        ok: true,
        thread_id: inserted.id,
        messages: [],
        follow_up_count: globalCount,
        follow_up_remaining: followUpRemaining(globalCount),
      },
      200,
      req,
    );
  }

  if (action === "ask") {
    const threadId = parseThreadUuid(body.thread_id);
    const question =
      typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
    const idempotencyKey = parseIdempotencyKey(body.idempotency_key);

    if (!threadId || !question || !idempotencyKey) {
      return json(
        {
          ok: false,
          error_code: "BAD_REQUEST",
          message: "Thiếu thread_id, question hoặc idempotency_key.",
        },
        400,
        req,
      );
    }

    const { data: threadRow, error: threadErr } = await admin
      .from("tra_cuu_results_threads")
      .select("id, user_id, pick_context, anchor_intro, messages, follow_up_count")
      .eq("id", threadId)
      .maybeSingle();

    if (threadErr || !threadRow) {
      return json(
        { ok: false, error_code: "NOT_FOUND", message: "Không tìm thấy hội thoại." },
        404,
        req,
      );
    }

    const thread = threadRow as ThreadRow & { user_id: string };
    if (thread.user_id !== user.id) {
      return json(
        { ok: false, error_code: "FORBIDDEN", message: "Không có quyền." },
        403,
        req,
      );
    }

    const vnToday = todayIsoVietnam();
    const count = (thread.follow_up_count as number) ?? 0;
    const storedMessages = parseStoredTraCuuMessages(thread.messages);

    const { data: existingIdem } = await admin
      .from("tra_cuu_results_ask_idempotency")
      .select("id, answer, status, created_at")
      .eq("thread_id", threadId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingIdem?.status === "done" && existingIdem.answer?.trim()) {
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(
        {
          ok: true,
          answer: existingIdem.answer.trim(),
          client_action: "answer",
          follow_up_count: globalCount,
          follow_up_remaining: followUpRemaining(globalCount),
        },
        200,
        req,
      );
    }

    const cachedInThread = findCachedAnswer(storedMessages, question);
    if (cachedInThread) {
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(
        {
          ok: true,
          answer: cachedInThread,
          client_action: "answer",
          follow_up_count: globalCount,
          follow_up_remaining: followUpRemaining(globalCount),
        },
        200,
        req,
      );
    }

    const now = new Date().toISOString();
    if (existingIdem?.status === "pending") {
      const age = Date.now() - new Date(existingIdem.created_at as string).getTime();
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
        .from("tra_cuu_results_ask_idempotency")
        .update({ status: "failed", updated_at: now })
        .eq("id", existingIdem.id);
    }

    if (!existingIdem) {
      const { error: insIdemErr } = await admin
        .from("tra_cuu_results_ask_idempotency")
        .insert({
          thread_id: threadId,
          idempotency_key: idempotencyKey,
          question,
          status: "pending",
          updated_at: now,
        });

      if (insIdemErr) {
        const { data: raced } = await admin
          .from("tra_cuu_results_ask_idempotency")
          .select("answer, status, created_at")
          .eq("thread_id", threadId)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (
          raced?.status === "done" &&
          typeof raced.answer === "string" &&
          raced.answer.trim()
        ) {
          const globalCount = await fetchDailyCount(admin, user.id, vnToday);
          return json(
            {
              ok: true,
              answer: raced.answer.trim(),
              client_action: "answer",
              follow_up_count: globalCount,
              follow_up_remaining: followUpRemaining(globalCount),
            },
            200,
            req,
          );
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
    } else if (existingIdem.status === "failed") {
      await admin
        .from("tra_cuu_results_ask_idempotency")
        .update({
          question,
          status: "pending",
          answer: null,
          updated_at: now,
        })
        .eq("id", existingIdem.id);
    }

    const parseSlot = await acquireGenerateReadingRateLimit(user.id, {
      followUp: true,
      scope: "tra-cuu-results:parse",
    });
    if (!parseSlot) {
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

    const parseRaw = await llmChat(
      [
        { role: "system", content: TRA_CUU_RESULTS_INTENT_PARSE_SYSTEM },
        {
          role: "user",
          content: stableStringify({
            pick_context: thread.pick_context,
            user_message: question,
          }),
        },
      ],
      PARSE_MAX_TOKENS,
      18_000,
      { profile: "flash", disableThinking: true, jsonMode: true },
    );

    const parsed = parseTraCuuIntentLlmJson(parseRaw);
    const actionKind = parsed?.action ?? "answer";

    if (actionKind === "change_task" && parsed?.intent) {
      await admin
        .from("tra_cuu_results_ask_idempotency")
        .update({
          answer: "",
          status: "done",
          updated_at: now,
        })
        .eq("thread_id", threadId)
        .eq("idempotency_key", idempotencyKey);
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(
        {
          ok: true,
          client_action: "change_task",
          intent: parsed.intent,
          intent_label: parsed.intent_label ?? parsed.intent,
          follow_up_count: globalCount,
          follow_up_remaining: followUpRemaining(globalCount),
        },
        200,
        req,
      );
    }

    if (
      actionKind === "open_day" &&
      parsed?.day_iso &&
      dayInPickContext(thread.pick_context, parsed.day_iso)
    ) {
      await admin
        .from("tra_cuu_results_ask_idempotency")
        .update({
          answer: "",
          status: "done",
          updated_at: now,
        })
        .eq("thread_id", threadId)
        .eq("idempotency_key", idempotencyKey);
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(
        {
          ok: true,
          client_action: "open_day",
          day_iso: parsed.day_iso,
          follow_up_count: globalCount,
          follow_up_remaining: followUpRemaining(globalCount),
        },
        200,
        req,
      );
    }

    const { data: trialProfile } = await admin
      .from("profiles")
      .select("subscription_expires_at, onboarding_trial_questions_used")
      .eq("id", user.id)
      .maybeSingle();
    const trialMax = await readOnboardingTrialQuestionsMax(admin);
    const consumeTrial = shouldConsumeTrialQuestion(trialProfile);
    if (consumeTrial && !hasOnboardingTrialAccess(trialProfile, trialMax)) {
      return json(
        {
          ok: false,
          error_code: "TRIAL_EXHAUSTED",
          message: "Bạn đã dùng hết lượt thử. Đặt lịch để tiếp tục.",
        },
        402,
        req,
      );
    }

    const answerSlot = await acquireGenerateReadingRateLimit(user.id, {
      followUp: true,
      scope: "tra-cuu-results:ask",
    });
    if (!answerSlot) {
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

    const refinedQ = parsed?.refined_question?.trim() || question;
    const chatMessages = buildTraCuuResultsFollowUpMessages(
      thread.pick_context,
      String(thread.anchor_intro ?? ""),
      storedMessages,
      refinedQ,
    );

    const answer = await llmChat(
      chatMessages,
      READING_MAX_TOKENS_DAY_DETAIL_FOLLOW_UP,
      DAY_DETAIL_REQUEST_TIMEOUT_MS,
      { profile: "flash", disableThinking: true },
    );

    const trimmed = answer?.trim() ?? "";
    if (!trimmed) {
      await refundDailyQuota(admin, user.id, vnToday);
      await admin
        .from("tra_cuu_results_ask_idempotency")
        .update({ status: "failed", updated_at: now })
        .eq("thread_id", threadId)
        .eq("idempotency_key", idempotencyKey);
      return json(
        {
          ok: false,
          error_code: "LLM_EMPTY",
          message: "Chưa nhận được câu trả lời. Thử lại sau.",
        },
        502,
        req,
      );
    }

    await admin
      .from("tra_cuu_results_ask_idempotency")
      .update({
        answer: trimmed,
        status: "done",
        updated_at: now,
      })
      .eq("thread_id", threadId)
      .eq("idempotency_key", idempotencyKey);

    const nextMessages = appendTraCuuThreadTurns(
      storedMessages,
      question,
      trimmed,
    );
    const nextCount = count + 1;

    const { data: updated, error: updErr } = await admin
      .from("tra_cuu_results_threads")
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
      await finalizeOnboardingTrialConsume(
        admin,
        user.id,
        consumeTrial,
        "tra-cuu-results-chat:answer",
      );
      return json(
        {
          ok: true,
          client_action: "answer",
          answer: trimmed,
          follow_up_count: inc.count,
          follow_up_remaining: followUpRemaining(inc.count),
        },
        200,
        req,
      );
    }

    console.warn("tra-cuu-results-chat ask thread update race", updErr?.message);

    const { data: reloaded } = await admin
      .from("tra_cuu_results_threads")
      .select("follow_up_count, messages")
      .eq("id", threadId)
      .maybeSingle();

    const reloadedMessages = parseStoredTraCuuMessages(reloaded?.messages);
    const recovered = findCachedAnswer(reloadedMessages, question);
    if (recovered) {
      await finalizeOnboardingTrialConsume(
        admin,
        user.id,
        consumeTrial,
        "tra-cuu-results-chat:answer-recovered",
      );
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(
        {
          ok: true,
          client_action: "answer",
          answer: recovered,
          follow_up_count: globalCount,
          follow_up_remaining: followUpRemaining(globalCount),
        },
        200,
        req,
      );
    }

    const { data: idemAfter } = await admin
      .from("tra_cuu_results_ask_idempotency")
      .select("answer, status")
      .eq("thread_id", threadId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (idemAfter?.status === "done" && typeof idemAfter.answer === "string" &&
      idemAfter.answer.trim()) {
      await finalizeOnboardingTrialConsume(
        admin,
        user.id,
        consumeTrial,
        "tra-cuu-results-chat:answer-idempotent",
      );
      const globalCount = await fetchDailyCount(admin, user.id, vnToday);
      return json(
        {
          ok: true,
          client_action: "answer",
          answer: idemAfter.answer.trim(),
          follow_up_count: globalCount,
          follow_up_remaining: followUpRemaining(globalCount),
        },
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
    { ok: false, error_code: "BAD_REQUEST", message: "action không hợp lệ." },
    400,
    req,
  );
});
