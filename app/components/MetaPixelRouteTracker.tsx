import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import {
  isMetaPixelRuntimeEnabled,
  trackMetaPageView,
} from "~/lib/meta-pixel";

/** SPA navigations after the first PageView from `<head>` base code. */
export function MetaPixelRouteTracker() {
  const location = useLocation();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (!isMetaPixelRuntimeEnabled()) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    trackMetaPageView();
  }, [location.pathname, location.search]);

  return null;
}
