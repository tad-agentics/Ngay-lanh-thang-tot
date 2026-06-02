import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/auth-post-login", () => ({
  resolvePostLoginPath: vi.fn(),
}));
vi.mock("~/lib/auth", () => ({
  useAuth: vi.fn(),
}));

import { resolvePostLoginPath } from "~/lib/auth-post-login";
import { useAuth } from "~/lib/auth";
import { useLandingPrimaryCta } from "~/hooks/useLandingPrimaryCta";

describe("useLandingPrimaryCta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      session: null,
      signOut: vi.fn(),
    });
    vi.mocked(resolvePostLoginPath).mockResolvedValue("/lich");
  });

  it("shows returning link and signup for signed-out users", () => {
    const { result } = renderHook(() => useLandingPrimaryCta(""));
    expect(result.current.showReturningLink).toBe(true);
    expect(result.current.primaryHref).toBe("/dang-ky");
    expect(result.current.openCalendarHref).toBe("/dang-nhap?return_to=%2Flich");
    expect(result.current.disabled).toBe(false);
    expect(result.current.showPrimaryArrow).toBe(true);
  });

  it("disables CTA while auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      session: null,
      signOut: vi.fn(),
    });
    const { result } = renderHook(() => useLandingPrimaryCta(""));
    expect(result.current.disabled).toBe(true);
    expect(result.current.showReturningLink).toBe(false);
  });

  it("routes signed-in users to resolved destination", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" } as ReturnType<typeof useAuth>["user"],
      loading: false,
      session: null,
      signOut: vi.fn(),
    });
    const { result } = renderHook(() => useLandingPrimaryCta("REF1"));

    await waitFor(() => {
      expect(result.current.primaryHref).toBe("/lich");
    });

    expect(result.current.primaryLabel).toBe("Mở lịch của tôi");
    expect(result.current.showReturningLink).toBe(false);
    expect(result.current.disabled).toBe(false);
    expect(result.current.heroSubline).toContain("Tiếp tục xem lịch");
    expect(result.current.openCalendarHref).toBe(
      "/dang-nhap?ref=REF1&return_to=%2Flich",
    );
  });
});
