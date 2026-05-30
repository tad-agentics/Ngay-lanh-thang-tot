import * as Sentry from "@sentry/react";

let initialized = false;

function sentryDsn(): string | undefined {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (typeof dsn !== "string") return undefined;
  const trimmed = dsn.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Call once on client boot (root module). No-op without DSN or during SSR/prerender. */
export function initSentry(): void {
  if (typeof window === "undefined") return;
  const dsn = sentryDsn();
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    sendDefaultPii: false,
  });
  initialized = true;
}

export function isSentryInitialized(): boolean {
  return initialized;
}

export type ClientErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

/** Report UI errors to Sentry when configured; always logs in dev. */
export function captureClientException(
  error: unknown,
  context?: ClientErrorContext,
): void {
  if (import.meta.env.DEV) {
    console.error("[client-error]", context?.tags ?? {}, error, context?.extra);
  }

  const dsn = sentryDsn();
  if (!dsn) return;

  if (!initialized) initSentry();
  if (!initialized) return;

  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    if (context?.extra) {
      scope.setContext("client", context.extra);
    }
    Sentry.captureException(error);
  });
}
