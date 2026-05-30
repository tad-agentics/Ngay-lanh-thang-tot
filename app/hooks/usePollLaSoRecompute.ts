import { useEffect, useRef } from "react";

import { supabase } from "~/lib/supabase";

const POLL_MS = 2_000;
const MAX_ATTEMPTS = 30;

/**
 * G1 — poll `la_so_recompute_status` until ready/failed (max ~60s).
 */
export function usePollLaSoRecompute(
  userId: string | null | undefined,
  status: string | null | undefined,
  options: {
    onReady?: () => void | Promise<void>;
    onFailed?: () => void | Promise<void>;
  } = {},
): void {
  const { onReady, onFailed } = options;
  const onReadyRef = useRef(onReady);
  const onFailedRef = useRef(onFailed);
  onReadyRef.current = onReady;
  onFailedRef.current = onFailed;

  useEffect(() => {
    if (!userId || status !== "pending") return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function tick(): Promise<boolean> {
      const { data } = await supabase
        .from("profiles")
        .select("la_so_recompute_status")
        .eq("id", userId!)
        .maybeSingle();

      if (cancelled) return true;
      const next = data?.la_so_recompute_status;
      if (next === "ready") {
        await onReadyRef.current?.();
        return true;
      }
      if (next === "failed") {
        await onFailedRef.current?.();
        return true;
      }
      return false;
    }

    async function run(): Promise<void> {
      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) return;
      attempts += 1;
      const done = await tick();
      if (done && timer != null) {
        clearInterval(timer);
        timer = null;
      }
    }

    timer = setInterval(() => {
      void run();
    }, POLL_MS);
    void run();

    return () => {
      cancelled = true;
      if (timer != null) clearInterval(timer);
    };
  }, [userId, status]);
}
