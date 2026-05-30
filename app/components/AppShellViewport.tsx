import type { ReactNode } from "react";

/**
 * Centers the authenticated app in a capped column on wide viewports; full width on narrow.
 * Width token: `--app-shell-max-width` in `theme.css` (default ~768px / tablet portrait).
 */
export function AppShellViewport({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-dvh w-full justify-center"
      style={{ background: "var(--bg, #e4dfd6)" }}
    >
      <div
        className="relative box-border flex h-dvh w-full max-w-[var(--app-shell-max-width)] flex-col overflow-hidden sm:shadow-md"
        style={{
          background: "var(--paper, #f1ece1)",
          borderLeft: "1px solid rgba(154, 124, 34, 0.12)",
          borderRight: "1px solid rgba(154, 124, 34, 0.12)",
          boxShadow: "0 1px 3px rgba(24, 21, 14, 0.06)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
