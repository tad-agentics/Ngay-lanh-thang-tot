import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { useMarketingConsent } from "~/hooks/useMarketingConsent";
import {
  isMetaPixelRuntimeEnabled,
  trackMetaPageView,
} from "~/lib/meta-pixel";

/** SPA navigations after the first PageView (see MetaPixelBootstrap). */
export function MetaPixelRouteTracker() {
  const location = useLocation();
  const { granted } = useMarketingConsent();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (!isMetaPixelRuntimeEnabled() || !granted) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    trackMetaPageView();
  }, [granted, location.pathname, location.search]);

  return null;
}
