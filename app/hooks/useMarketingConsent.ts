import { useCallback, useEffect, useState } from "react";

import {
  MARKETING_CONSENT_CHANGED_EVENT,
  readMarketingConsent,
  writeMarketingConsent,
  type MarketingConsent,
} from "~/lib/meta-pixel-consent";

export function useMarketingConsent() {
  const [choice, setChoice] = useState<MarketingConsent | null>(() =>
    typeof window === "undefined" ? null : readMarketingConsent(),
  );

  useEffect(() => {
    const sync = () => setChoice(readMarketingConsent());
    window.addEventListener(MARKETING_CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(MARKETING_CONSENT_CHANGED_EVENT, sync);
  }, []);

  const setConsent = useCallback((next: MarketingConsent) => {
    writeMarketingConsent(next);
    setChoice(next);
  }, []);

  return {
    choice,
    setConsent,
    granted: choice === "granted",
    denied: choice === "denied",
    needsPrompt: choice == null,
  };
}
