import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { CNoDatesFoundScreen } from "~/components/direction-c/CNoDatesFoundScreen";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import type { TraCuuEmptyState } from "~/lib/tra-cuu-session";
import {
  loadTraCuuEmpty,
  persistTraCuuEmpty,
} from "~/lib/tra-cuu-session";

export default function TraCuuKhongCoNgayRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as TraCuuEmptyState | null;
  const [state, setState] = useState<TraCuuEmptyState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (navState?.intentLabel && navState.rangeStart) {
      persistTraCuuEmpty(navState);
      setState(navState);
      setHydrated(true);
      return;
    }
    const stored = loadTraCuuEmpty();
    if (stored) {
      setState(stored);
    }
    setHydrated(true);
  }, [navState]);

  useEffect(() => {
    if (hydrated && !state?.intentLabel) {
      navigate("/tra-cuu", { replace: true });
    }
  }, [hydrated, state, navigate]);

  if (!hydrated || !state) return null;

  return (
    <DirectionCScreenBoundary screen="Tra cứu">
      <CNoDatesFoundScreen state={state} />
    </DirectionCScreenBoundary>
  );
}
