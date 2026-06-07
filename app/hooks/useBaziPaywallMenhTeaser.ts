import { useEffect, useRef, useState } from "react";

import type { LaSoJson } from "~/lib/api-types";
import { loadBaziPaywallBundleCached } from "~/lib/bazi-reading-load";
import {
  baziReadingCacheRevision,
  readBaziPaywallTeaserSession,
} from "~/lib/bazi-reading-session";
import type { Profile } from "~/lib/profile-context";

export type UseBaziPaywallMenhTeaserOptions = {
  onGenFailed?: () => void;
};

type TeaserState = {
  menhProse: string | null;
  menhLoading: boolean;
  menhFailed: boolean;
  laSoDisplay: LaSoJson | null;
};

function readInitialTeaserState(profile: Profile | null): TeaserState {
  if (!profile) {
    return {
      menhProse: null,
      menhLoading: false,
      menhFailed: false,
      laSoDisplay: null,
    };
  }

  const laSo = (profile.la_so as LaSoJson | null) ?? null;
  const revision = baziReadingCacheRevision(profile);
  const cached = readBaziPaywallTeaserSession(profile.id, revision);
  if (cached) {
    return {
      menhProse: cached.menhOverview,
      menhLoading: false,
      menhFailed: false,
      laSoDisplay: cached.laSoDisplay ?? laSo,
    };
  }

  return {
    menhProse: null,
    menhLoading: true,
    menhFailed: false,
    laSoDisplay: laSo,
  };
}

export function useBaziPaywallMenhTeaser(
  profile: Profile | null,
  options?: UseBaziPaywallMenhTeaserOptions,
) {
  const [state, setState] = useState<TeaserState>(() =>
    readInitialTeaserState(profile),
  );
  const genRef = useRef(0);
  const onGenFailedRef = useRef(options?.onGenFailed);
  onGenFailedRef.current = options?.onGenFailed;

  function reload() {
    if (!profile) return;
    const gen = ++genRef.current;
    setState((prev) => ({ ...prev, menhLoading: true, menhFailed: false }));
    void (async () => {
      const bundle = await loadBaziPaywallBundleCached(profile);
      if (gen !== genRef.current) return;
      if (bundle.menhGenFailed) onGenFailedRef.current?.();
      setState({
        laSoDisplay: bundle.laSoDisplay ?? ((profile.la_so as LaSoJson) ?? null),
        menhProse: bundle.menhOverview || null,
        menhFailed: bundle.menhGenFailed,
        menhLoading: false,
      });
    })();
  }

  const revision = profile ? baziReadingCacheRevision(profile) : "";

  useEffect(() => {
    if (!profile) {
      setState(readInitialTeaserState(null));
      return;
    }

    const initial = readInitialTeaserState(profile);
    setState(initial);
    if (!initial.menhLoading) return;

    const gen = ++genRef.current;
    void (async () => {
      const bundle = await loadBaziPaywallBundleCached(profile);
      if (gen !== genRef.current) return;
      if (bundle.menhGenFailed) onGenFailedRef.current?.();
      setState({
        laSoDisplay: bundle.laSoDisplay ?? ((profile.la_so as LaSoJson) ?? null),
        menhProse: bundle.menhOverview || null,
        menhFailed: bundle.menhGenFailed,
        menhLoading: false,
      });
    })();

    return () => {
      genRef.current += 1;
    };
  }, [profile?.id, revision]);

  return {
    menhProse: state.menhProse,
    menhLoading: state.menhLoading,
    menhFailed: state.menhFailed,
    laSoDisplay: state.laSoDisplay,
    reload,
  };
}
