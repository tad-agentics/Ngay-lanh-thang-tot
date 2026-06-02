import { useEffect } from "react";

import { useMarketingConsent } from "~/hooks/useMarketingConsent";
import {
  ensureMetaPixelLoaded,
  isMetaPixelRuntimeEnabled,
  trackMetaPageView,
} from "~/lib/meta-pixel";

/** Load Meta Pixel after marketing consent; fires first PageView. */
export function MetaPixelBootstrap() {
  const { granted } = useMarketingConsent();

  useEffect(() => {
    if (!isMetaPixelRuntimeEnabled() || !granted) return;
    void ensureMetaPixelLoaded().then(() => trackMetaPageView());
  }, [granted]);

  return null;
}
