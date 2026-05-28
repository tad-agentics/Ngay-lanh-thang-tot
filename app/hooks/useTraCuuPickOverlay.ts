import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useProfile } from "~/hooks/useProfile";
import {
  delayMs,
  runTraCuuChonNgay,
  TRA_CUU_PICK_MIN_OVERLAY_MS,
  TRA_CUU_PICK_SLOW_MS,
  type TraCuuPickPending,
} from "~/lib/tra-cuu-pick";
import {
  persistTraCuuEmpty,
  persistTraCuuKetQua,
} from "~/lib/tra-cuu-session";

export function useTraCuuPickOverlay() {
  const navigate = useNavigate();
  const { profile, refresh: refreshProfile } = useProfile();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [slow, setSlow] = useState(false);
  const [intentLabel, setIntentLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cancelledRef = useRef(false);
  const runIdRef = useRef(0);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    runIdRef.current += 1;
    setOverlayOpen(false);
    setSlow(false);
    setIntentLabel(null);
    setBusy(false);
  }, []);

  const startPick = useCallback(
    async (pending: TraCuuPickPending) => {
      if (busy || !profile) return;
      const runId = ++runIdRef.current;
      cancelledRef.current = false;
      setBusy(true);
      setOverlayOpen(true);
      setSlow(false);
      setIntentLabel(pending.intentLabel);

      const slowTimer = window.setTimeout(() => {
        if (cancelledRef.current || runId !== runIdRef.current) return;
        setSlow(true);
      }, TRA_CUU_PICK_SLOW_MS);

      try {
        const [result] = await Promise.all([
          runTraCuuChonNgay(profile, pending),
          delayMs(TRA_CUU_PICK_MIN_OVERLAY_MS),
        ]);

        if (cancelledRef.current || runId !== runIdRef.current) return;

        if (!result.ok) {
          if (result.code === "NO_DAYS") {
            persistTraCuuEmpty(result.ketQua);
            navigate("/tra-cuu/khong-co-ngay", {
              replace: true,
              state: result.ketQua,
            });
            return;
          }
          toast.error(result.message);
          return;
        }

        await refreshProfile();
        if (cancelledRef.current || runId !== runIdRef.current) return;

        persistTraCuuKetQua(result.ketQua);
        navigate("/tra-cuu/ket-qua", {
          replace: false,
          state: result.ketQua,
        });
      } finally {
        window.clearTimeout(slowTimer);
        if (runId === runIdRef.current) {
          setOverlayOpen(false);
          setSlow(false);
          setIntentLabel(null);
          setBusy(false);
        }
      }
    },
    [busy, profile, navigate, refreshProfile],
  );

  return {
    overlayOpen,
    slow,
    intentLabel,
    busy,
    startPick,
    cancel,
  };
}
