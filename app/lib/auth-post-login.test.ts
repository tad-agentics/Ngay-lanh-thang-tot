import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  tryConsumePendingReferralClaim,
  getSession,
  exchangeCodeForSession,
  from,
} = vi.hoisted(() => ({
  tryConsumePendingReferralClaim: vi.fn(),
  getSession: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  from: vi.fn(),
}));

vi.mock("~/lib/referral-claim", () => ({
  tryConsumePendingReferralClaim,
}));

vi.mock("~/lib/supabase", () => ({
  supabase: {
    auth: { getSession, exchangeCodeForSession },
    from,
  },
}));

import {
  exchangeOAuthCodeFromUrl,
  resolvePostLoginPath,
} from "./auth-post-login";

function mockProfileRow(row: {
  onboarding_completed_at: string | null;
  ngay_sinh: string | null;
  gio_sinh?: string | null;
  gioi_tinh?: string | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  from.mockReturnValue({ select });
}

describe("resolvePostLoginPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consumes pending referral before resolving destination", async () => {
    const session = { access_token: "tok", user: { id: "u1" } };
    getSession.mockResolvedValue({ data: { session }, error: null });
    tryConsumePendingReferralClaim.mockResolvedValue(undefined);
    mockProfileRow({
      onboarding_completed_at: null,
      ngay_sinh: "1990-01-01",
      gio_sinh: null,
    });

    const dest = await resolvePostLoginPath();

    expect(tryConsumePendingReferralClaim).toHaveBeenCalledWith(session);
    expect(dest).toBe("/dang-ky");
  });

  it("routes to calendar build when birth date and hour exist", async () => {
    const session = { access_token: "tok", user: { id: "u1" } };
    getSession.mockResolvedValue({ data: { session }, error: null });
    tryConsumePendingReferralClaim.mockResolvedValue(undefined);
    mockProfileRow({
      onboarding_completed_at: null,
      ngay_sinh: "1990-01-01",
      gio_sinh: "05:00:00",
      gioi_tinh: "nam",
    });

    const dest = await resolvePostLoginPath();

    expect(dest).toBe("/dang-dung-lich");
  });

  it("routes OAuth legacy users missing gender back to dang-ky", async () => {
    const session = { access_token: "tok", user: { id: "u1" } };
    getSession.mockResolvedValue({ data: { session }, error: null });
    tryConsumePendingReferralClaim.mockResolvedValue(undefined);
    mockProfileRow({
      onboarding_completed_at: "2025-01-01T00:00:00Z",
      ngay_sinh: "1990-01-01",
      gio_sinh: "05:00:00",
      gioi_tinh: null,
    });

    const dest = await resolvePostLoginPath();

    expect(dest).toBe("/dang-ky");
  });

  it("skips referral when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const dest = await resolvePostLoginPath();

    expect(tryConsumePendingReferralClaim).not.toHaveBeenCalled();
    expect(dest).toBe("/dang-nhap");
  });
});

describe("exchangeOAuthCodeFromUrl", () => {
  const prevHref = window.location.href;

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/auth/callback");
  });

  afterEach(() => {
    window.history.replaceState({}, "", prevHref);
  });

  it("skips exchange when detectSessionInUrl already established a session", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
      error: null,
    });
    window.history.replaceState(
      {},
      "",
      "/auth/callback?code=already-consumed",
    );

    const err = await exchangeOAuthCodeFromUrl();

    expect(err).toBeNull();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("treats failed exchange as success when session exists after race", async () => {
    getSession
      .mockResolvedValueOnce({ data: { session: null }, error: null })
      .mockResolvedValueOnce({
        data: { session: { access_token: "tok" } },
        error: null,
      });
    window.history.replaceState({}, "", "/auth/callback?code=pkce-1");
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid flow state" },
    });

    const err = await exchangeOAuthCodeFromUrl();

    expect(err).toBeNull();
    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-1");
  });

  it("returns error when exchange fails and session stays empty", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    window.history.replaceState({}, "", "/auth/callback?code=bad");
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid grant" },
    });

    const err = await exchangeOAuthCodeFromUrl();

    expect(err).toBe("invalid grant");
  });

  it("exchanges code when no session yet", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    window.history.replaceState({}, "", "/auth/callback?code=good");
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const err = await exchangeOAuthCodeFromUrl();

    expect(err).toBeNull();
    expect(exchangeCodeForSession).toHaveBeenCalledWith("good");
  });
});
