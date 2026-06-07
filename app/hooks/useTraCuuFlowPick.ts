import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useProfile } from "~/hooks/useProfile";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import {
  addDaysIso,
  isoDateToDdMmYyyy,
  localTodayIsoDate,
} from "~/lib/tu-tru-dates";
import {
  delayMs,
  runTraCuuChonNgay,
  TRA_CUU_PICK_MIN_OVERLAY_MS,
  TRA_CUU_PICK_SLOW_MS,
  type TraCuuPickPending,
} from "~/lib/tra-cuu-pick";
import { persistTraCuuEmpty } from "~/lib/tra-cuu-session";

export type TraCuuFlowPickInput = {
  intent: TraCuuPickPending["intent"];
  intentLabel: string;
  rangeDays: number;
};

export function useTraCuuFlowPick() {
  const navigate = useNavigate();
  const { profile, refresh: refreshProfile } = useProfile();
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const cancelledRef = useRef(false);
  const runIdRef = useRef(0);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    runIdRef.current += 1;
    setBusy(false);
    setSlow(false);
  }, []);

  const runPick = useCallback(
    async (input: TraCuuFlowPickInput): Promise<ChonNgayKetQuaState | null> => {
      if (busy || !profile?.ngay_sinh) return null;

      const rangeStart = localTodayIsoDate();
      const rangeEnd =
        addDaysIso(rangeStart, input.rangeDays - 1) ?? rangeStart;

      const rs = isoDateToDdMmYyyy(rangeStart);
      const re = isoDateToDdMmYyyy(rangeEnd);
      if (!rs || !re) {
        toast.error("Khoảng ngày không hợp lệ.");
        return null;
      }

      const pending: TraCuuPickPending = {
        intent: input.intent,
        intentLabel: input.intentLabel,
        rangeStart,
        rangeEnd,
        daysInclusive: input.rangeDays,
      };

      const runId = ++runIdRef.current;
      cancelledRef.current = false;
      setBusy(true);
      setSlow(false);

      const slowTimer = window.setTimeout(() => {
        if (cancelledRef.current || runId !== runIdRef.current) return;
        setSlow(true);
      }, TRA_CUU_PICK_SLOW_MS);

      try {
        const [result] = await Promise.all([
          runTraCuuChonNgay(profile, pending),
          delayMs(TRA_CUU_PICK_MIN_OVERLAY_MS),
        ]);

        if (cancelledRef.current || runId !== runIdRef.current) return null;

        if (!result.ok) {
          if (result.code === "NO_DAYS") {
            persistTraCuuEmpty(result.ketQua);
            navigate("/tra-cuu/khong-co-ngay", {
              replace: true,
              state: result.ketQua,
            });
            return null;
          }
          if (result.code === "SUB_EXPIRED") {
            navigate("/dat-lich");
            return null;
          }
          toast.error(result.message);
          return null;
        }

        await refreshProfile();
        if (cancelledRef.current || runId !== runIdRef.current) return null;

        return result.ketQua;
      } finally {
        window.clearTimeout(slowTimer);
        if (runId === runIdRef.current) {
          setBusy(false);
          setSlow(false);
        }
      }
    },
    [busy, profile, navigate, refreshProfile],
  );

  return { busy, slow, runPick, cancel };
}
