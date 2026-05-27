import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { CPickLoadingScreen } from "~/components/direction-c/CPickLoadingScreen";
import { mapChonNgayPayloadToResultDays } from "~/lib/chon-ngay-result";
import type { TuTruIntent } from "~/lib/api-types";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { isoDateToDdMmYyyy } from "~/lib/tu-tru-dates";
import { TU_TRU_INTENT_OPTIONS } from "~/lib/tu-tru-intents";
import { useProfile } from "~/hooks/useProfile";

export type TraCuuPickPendingState = {
  intent: TuTruIntent;
  intentLabel: string;
  rangeStart: string;
  rangeEnd: string;
  daysInclusive: number;
};

export default function TraCuuDangTimRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, refresh: refreshProfile } = useProfile();
  const state = location.state as TraCuuPickPendingState | null;
  const ranRef = useRef(false);

  useEffect(() => {
    if (!state?.intent || !profile) {
      navigate("/tra-cuu", { replace: true });
      return;
    }
    if (ranRef.current) return;
    ranRef.current = true;

    const rs = isoDateToDdMmYyyy(state.rangeStart);
    const re = isoDateToDdMmYyyy(state.rangeEnd);
    if (!rs || !re) {
      toast.error("Khoảng ngày không hợp lệ.");
      navigate("/tra-cuu", { replace: true });
      return;
    }

    void (async () => {
      const base = profileToBatTuPersonQuery(profile);
      const res = await invokeBatTu({
        op: "chon-ngay",
        body: {
          ...base,
          intent: state.intent,
          range_start: rs,
          range_end: re,
          top_n: 5,
        },
      });
      if (!res.ok) {
        toast.error(res.message);
        navigate("/tra-cuu", { replace: true });
        return;
      }
      await refreshProfile();
      const label =
        state.intentLabel ??
        TU_TRU_INTENT_OPTIONS.find((o) => o.value === state.intent)?.label ??
        state.intent;
      const days = mapChonNgayPayloadToResultDays(res.data, 5);
      if (days.length === 0) {
        navigate("/tra-cuu/khong-co-ngay", {
          replace: true,
          state: {
            intentLabel: label,
            daysInclusive: state.daysInclusive,
          },
        });
        return;
      }
      navigate("/tra-cuu/ket-qua", {
        replace: true,
        state: {
          intent: state.intent,
          intentLabel: label,
          rangeStart: state.rangeStart,
          rangeEnd: state.rangeEnd,
          daysInclusive: state.daysInclusive,
          payload: res.data,
        },
      });
    })();
  }, [state, profile, navigate, refreshProfile]);

  return <CPickLoadingScreen intentLabel={state?.intentLabel} />;
}
