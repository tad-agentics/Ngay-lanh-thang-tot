import { useMarketingConsent } from "~/hooks/useMarketingConsent";
import {
  isMetaPixelRuntimeEnabled,
  metaPixelNoscriptImageUrl,
} from "~/lib/meta-pixel";

/** Noscript PageView beacon — only when user granted marketing consent. */
export function MetaPixelNoscript() {
  const { granted } = useMarketingConsent();

  if (!isMetaPixelRuntimeEnabled() || !granted) {
    return null;
  }

  return (
    <noscript>
      <img
        height={1}
        width={1}
        style={{ display: "none" }}
        alt=""
        src={metaPixelNoscriptImageUrl()}
      />
    </noscript>
  );
}
