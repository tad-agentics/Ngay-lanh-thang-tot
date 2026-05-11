import { useEffect, useRef } from "react";

import { supabase } from "~/lib/supabase";

const DEFAULT_INTERVAL_MS = 4_000;
const DEFAULT_MAX_ATTEMPTS = 45;

/**
 * Poll `payment_orders.status` until `paid` (webhook PayOS đã xử lý).
 * Tối đa `maxAttempts` lần (mặc định ~3 phút nếu mỗi 4s).
 */
export function usePollPaymentOrderPaid(
  orderId: string | null | undefined,
  enabled: boolean,
  options: {
    onPaid: () => void | Promise<void>;
    onGiveUp?: () => void;
    intervalMs?: number;
    maxAttempts?: number;
  },
): void {
  const {
    onPaid,
    onGiveUp,
    intervalMs = DEFAULT_INTERVAL_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
  } = options;
  const onPaidRef = useRef(onPaid);
  const onGiveUpRef = useRef(onGiveUp);
  onPaidRef.current = onPaid;
  onGiveUpRef.current = onGiveUp;

  useEffect(() => {
    if (!enabled || !orderId) return;

    const id = orderId;

    let cancelled = false;
    let pollCount = 0;
    let gaveUp = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tick(): Promise<boolean> {
      const { data: row } = await supabase
        .from("payment_orders")
        .select("status")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return true;
      if (row?.status === "paid") {
        await onPaidRef.current();
        return true;
      }
      return false;
    }

    function giveUp(): void {
      if (gaveUp) return;
      gaveUp = true;
      onGiveUpRef.current?.();
    }

    async function runPoll(): Promise<void> {
      if (cancelled) return;
      if (pollCount >= maxAttempts) {
        giveUp();
        if (intervalId != null) {
          clearInterval(intervalId);
          intervalId = null;
        }
        return;
      }
      pollCount += 1;
      const done = await tick();
      if (done && intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    intervalId = setInterval(() => {
      void runPoll();
    }, intervalMs);

    void runPoll();

    return () => {
      cancelled = true;
      if (intervalId != null) clearInterval(intervalId);
    };
  }, [enabled, orderId, intervalMs, maxAttempts]);
}
