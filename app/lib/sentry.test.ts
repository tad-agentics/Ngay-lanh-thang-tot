import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureException = vi.fn();
const init = vi.fn();
const setTag = vi.fn();
const setContext = vi.fn();

vi.mock("@sentry/react", () => ({
  init,
  captureException,
  withScope: (fn: (scope: { setTag: typeof setTag; setContext: typeof setContext }) => void) =>
    fn({ setTag, setContext }),
}));

describe("captureClientException", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("MODE", "production");
    vi.stubEnv("PROD", true);
    vi.stubEnv("DEV", false);
    init.mockClear();
    captureException.mockClear();
    setTag.mockClear();
    setContext.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not call Sentry when VITE_SENTRY_DSN is unset", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    const { captureClientException, initSentry } = await import("./sentry");
    initSentry();
    captureClientException(new Error("boom"), { tags: { screen: "Lịch" } });
    expect(init).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("initializes and captures when DSN is set", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@o0.ingest.sentry.io/0");
    const { captureClientException, initSentry } = await import("./sentry");
    initSentry();
    const err = new Error("render failed");
    captureClientException(err, {
      tags: { boundary: "DirectionCScreenBoundary", screen: "Lịch" },
      extra: { componentStack: "at Foo" },
    });
    expect(init).toHaveBeenCalled();
    expect(captureException).toHaveBeenCalledWith(err);
    expect(setTag).toHaveBeenCalledWith("boundary", "DirectionCScreenBoundary");
    expect(setTag).toHaveBeenCalledWith("screen", "Lịch");
  });
});
