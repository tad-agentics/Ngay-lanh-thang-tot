import { useCallback, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const ios = isIOS();
  const standalone = isStandalone();

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === "accepted";
  }, [deferred]);

  const markEngaged = useCallback(() => setReady(true), []);

  return useMemo(
    () => ({
      /** Chromium: install prompt available */
      canInstall: !!deferred && !standalone,
      /** User scrolled / tapped — allow showing install UI */
      engaged: ready,
      markEngaged,
      promptInstall,
      /** Safari iOS: show manual “Add to Home Screen” copy */
      showIosInstructions: ios && !standalone,
      isStandalone: standalone,
    }),
    [
      deferred,
      standalone,
      ready,
      markEngaged,
      promptInstall,
      ios,
    ],
  );
}
