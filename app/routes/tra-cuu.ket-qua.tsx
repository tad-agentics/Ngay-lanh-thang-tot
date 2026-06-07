import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { CTraCuuFlow } from "~/components/direction-c/tra-cuu/CTraCuuFlow";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import {
  loadTraCuuKetQua,
  persistTraCuuKetQua,
} from "~/lib/tra-cuu-session";

/** Backward compat — hydrate inline results flow from bookmark / legacy navigate. */
export default function TraCuuKetQuaRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as ChonNgayKetQuaState | null;
  const [state, setState] = useState<ChonNgayKetQuaState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (navState?.payload) {
      persistTraCuuKetQua(navState);
      setState(navState);
      setHydrated(true);
      return;
    }
    const stored = loadTraCuuKetQua();
    if (stored?.payload) {
      setState(stored);
    }
    setHydrated(true);
  }, [navState]);

  useEffect(() => {
    if (hydrated && !state?.payload) {
      navigate("/tra-cuu", { replace: true });
    }
  }, [hydrated, state, navigate]);

  if (!hydrated || !state?.payload) return null;

  return <CTraCuuFlow initialScreen="results" initialKetQua={state} />;
}
