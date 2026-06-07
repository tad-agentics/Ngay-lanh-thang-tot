import { useEffect, useState } from "react";

import {
  isTraCuuThinkingOverlayActive,
  subscribeTraCuuThinkingOverlay,
} from "~/lib/tra-cuu-thinking-overlay";

export function useTraCuuThinkingOverlay(): boolean {
  const [active, setActive] = useState(isTraCuuThinkingOverlayActive);

  useEffect(() => subscribeTraCuuThinkingOverlay(() => {
    setActive(isTraCuuThinkingOverlayActive());
  }), []);

  return active;
}
