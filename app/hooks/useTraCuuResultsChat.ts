import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useProfile } from "~/hooks/useProfile";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import { baziReadingBirthRevision } from "~/lib/bazi-reading-session";
import { useOnboardingTrialExhaustedModal } from "~/lib/onboarding-trial-exhausted-context";
import {
  canAccessPaidCalendar,
  hasOnboardingTrialAccess,
  isOnboardingTrialExhausted,
} from "~/lib/entitlements";
import type { LuanThreadTurn } from "~/lib/generate-reading";
import {
  invokeTraCuuResultsChatAsk,
  invokeTraCuuResultsChatOpen,
  type TraCuuResultsClientAction,
} from "~/lib/tra-cuu-results-chat";

export type TraCuuResultsChatTurn = {
  question: string;
  answer: string | null;
  loading: boolean;
  error: string | null;
  /** False while typewriter is revealing a fresh assistant reply. */
  typingDone: boolean;
};

type UseTraCuuResultsChatOptions = {
  state: ChonNgayKetQuaState;
  intro: string | null;
  enabled?: boolean;
  onQuotaChange?: (remaining: number) => void;
  onClientAction?: (action: TraCuuResultsClientAction) => void;
};

const OPEN_RETRY_DELAYS_MS = [0, 900, 1800] as const;

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function turnsFromServerMessages(messages: LuanThreadTurn[]): TraCuuResultsChatTurn[] {
  const synced: TraCuuResultsChatTurn[] = [];
  for (let i = 0; i < messages.length; i += 2) {
    const user = messages[i];
    const assistant = messages[i + 1];
    if (user?.role === "user" && assistant?.role === "assistant") {
      synced.push({
        question: user.content,
        answer: assistant.content,
        loading: false,
        error: null,
        typingDone: true,
      });
    }
  }
  return synced;
}

async function openThreadWithRetry(
  input: Parameters<typeof invokeTraCuuResultsChatOpen>[0],
  isCancelled: () => boolean,
): Promise<Awaited<ReturnType<typeof invokeTraCuuResultsChatOpen>>> {
  let last: Awaited<ReturnType<typeof invokeTraCuuResultsChatOpen>> = {
    ok: false,
    code: "NETWORK",
    message: "Không kết nối được.",
  };

  for (let attempt = 0; attempt < OPEN_RETRY_DELAYS_MS.length; attempt += 1) {
    if (isCancelled()) return last;
    const wait = OPEN_RETRY_DELAYS_MS[attempt];
    if (wait > 0) await delayMs(wait);
    if (isCancelled()) return last;

    const res = await invokeTraCuuResultsChatOpen(input);
    last = res;
    if (res.ok) return res;
  }

  if (!last.ok && last.code === "SUB_EXPIRED") {
    toast.error(last.message);
  } else {
    toast.error(last.ok ? "Không mở được hội thoại." : last.message);
  }
  return last;
}

export function useTraCuuResultsChat({
  state,
  intro,
  enabled = true,
  onQuotaChange,
  onClientAction,
}: UseTraCuuResultsChatOptions) {
  const { profile, refresh: refreshProfile } = useProfile();
  const { showOnboardingTrialExhaustedModal } = useOnboardingTrialExhaustedModal();
  const canChat = canAccessPaidCalendar(profile);
  const trialAccess = hasOnboardingTrialAccess(profile);
  const trialExhausted = isOnboardingTrialExhausted(profile);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [turns, setTurns] = useState<TraCuuResultsChatTurn[]>([]);
  const [submitBusy, setSubmitBusy] = useState(false);
  const idempotencyRef = useRef(0);
  const sessionKeyRef = useRef("");
  const introSyncedRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  const onQuotaChangeRef = useRef(onQuotaChange);
  stateRef.current = state;
  onQuotaChangeRef.current = onQuotaChange;

  const sessionKey = `${state.intent}:${state.rangeStart}:${state.rangeEnd}`;
  sessionKeyRef.current = sessionKey;

  useEffect(() => {
    setThreadId(null);
    setTurns([]);
    idempotencyRef.current = 0;
    introSyncedRef.current = null;
  }, [sessionKey]);

  useEffect(() => {
    if (!enabled || !profile || !canChat) return;

    let cancelled = false;
    const isCancelled = () => cancelled;
    const birthRevision = baziReadingBirthRevision(profile);
    const openSession = sessionKey;

    void openThreadWithRetry(
      {
        state: stateRef.current,
        birth_revision: birthRevision,
      },
      isCancelled,
    ).then((res) => {
      if (cancelled || sessionKeyRef.current !== openSession) return;
      if (!res.ok) return;

      setThreadId(res.thread_id);
      onQuotaChangeRef.current?.(res.follow_up_remaining);
      if (res.messages.length > 0) {
        setTurns(turnsFromServerMessages(res.messages));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, profile, canChat, sessionKey]);

  useEffect(() => {
    const introText = intro?.trim();
    if (!enabled || !profile || !canChat || !threadId || !introText) return;
    if (introSyncedRef.current === sessionKey) return;

    let cancelled = false;
    const patchSession = sessionKey;

    void invokeTraCuuResultsChatOpen({
      state: stateRef.current,
      birth_revision: baziReadingBirthRevision(profile),
      anchor_intro: introText,
    }).then((res) => {
      if (cancelled || sessionKeyRef.current !== patchSession) return;
      if (!res.ok) {
        if (res.code === "TRIAL_EXHAUSTED") {
          showOnboardingTrialExhaustedModal();
        }
        return;
      }
      introSyncedRef.current = patchSession;
      onQuotaChangeRef.current?.(res.follow_up_remaining);
      if (trialAccess) void refreshProfile();
    });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    profile,
    canChat,
    sessionKey,
    threadId,
    intro,
    trialAccess,
    refreshProfile,
    showOnboardingTrialExhaustedModal,
  ]);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || submitBusy) return;
      if (!canChat) {
        if (trialExhausted) {
          showOnboardingTrialExhaustedModal();
        } else {
          toast.error("Bạn đã dùng hết lượt chat miễn phí. Đặt lịch để tiếp tục.");
        }
        return;
      }
      const askSession = sessionKeyRef.current;
      const tid = threadId;
      if (!tid) {
        toast.error("Đang mở hội thoại… thử lại sau vài giây.");
        return;
      }

      setSubmitBusy(true);
      setTurns((prev) => [
        ...prev,
        { question: q, answer: null, loading: true, error: null, typingDone: false },
      ]);

      const idempotencyKey = `tracuu-res-${++idempotencyRef.current}-${Date.now()}`;
      const res = await invokeTraCuuResultsChatAsk({
        thread_id: tid,
        question: q,
        idempotency_key: idempotencyKey,
      });

      if (sessionKeyRef.current !== askSession) {
        setSubmitBusy(false);
        setTurns((prev) => prev.filter((t) => !(t.question === q && t.loading)));
        return;
      }

      setSubmitBusy(false);

      if (!res.ok) {
        setTurns((prev) => {
          const next = [...prev];
          const idx = next.findIndex((t) => t.question === q && t.loading);
          if (idx < 0) return prev;
          next[idx] = {
            question: q,
            answer: null,
            loading: false,
            error: res.message,
            typingDone: true,
          };
          return next;
        });
        if (res.code === "TRIAL_EXHAUSTED") {
          showOnboardingTrialExhaustedModal();
        } else if (res.message) {
          toast.error(res.message);
        }
        return;
      }

      onQuotaChangeRef.current?.(res.follow_up_remaining);
      if (trialAccess && res.type === "answer") {
        void refreshProfile();
      }

      if (res.type === "change_task" || res.type === "open_day") {
        setTurns((prev) => prev.filter((t) => !(t.question === q && t.loading)));
        onClientAction?.(res);
        return;
      }

      setTurns((prev) => {
        const next = [...prev];
        const idx = next.findIndex((t) => t.question === q && t.loading);
        if (idx < 0) return prev;
        next[idx] = {
          question: q,
          answer: res.answer,
          loading: false,
          error: null,
          typingDone: false,
        };
        return next;
      });
    },
    [
      submitBusy,
      canChat,
      trialAccess,
      trialExhausted,
      threadId,
      onClientAction,
      refreshProfile,
      showOnboardingTrialExhaustedModal,
    ],
  );

  const markTurnTypingDone = useCallback((index: number) => {
    setTurns((prev) =>
      prev.map((turn, i) =>
        i === index ? { ...turn, typingDone: true } : turn,
      ),
    );
  }, []);

  return {
    turns,
    submitBusy,
    canChat,
    trialAccess,
    trialExhausted,
    chatEnabled: Boolean(canChat && threadId),
    ask,
    markTurnTypingDone,
  };
}
