import type { ComponentType } from "react";

import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";

/** Wrap a pass-through route default export with a screen-level error boundary. */
export function withDirectionCScreenBoundary<P extends object>(
  Screen: ComponentType<P>,
  screen?: string,
): (props: P) => React.JSX.Element {
  function Wrapped(props: P): React.JSX.Element {
    return (
      <DirectionCScreenBoundary screen={screen}>
        <Screen {...props} />
      </DirectionCScreenBoundary>
    );
  }
  const name = Screen.displayName ?? Screen.name ?? "Screen";
  Wrapped.displayName = `DirectionCScreen(${name})`;
  return Wrapped;
}
