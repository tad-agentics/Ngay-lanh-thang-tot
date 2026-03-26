import type { ReactNode } from "react";

/**
 * Centers the authenticated app in a capped column on wide viewports; full width on narrow.
 * Width token: `--app-shell-max-width` in `theme.css` (default ~768px / tablet portrait).
 */
export function AppShellViewport({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-muted/55">
      <div
        className="relative box-border flex h-dvh w-full max-w-[var(--app-shell-max-width)] flex-col overflow-hidden bg-background shadow-sm ring-1 ring-border/25 sm:shadow-md"
      >
        {children}
      </div>
    </div>
  );
}
