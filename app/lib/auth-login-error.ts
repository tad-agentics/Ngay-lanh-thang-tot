/** Map Supabase sign-in errors to Direction C inline copy (FE-HANDOFF §3.3). */

export function isInvalidLoginCredentials(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("invalid login credentials") ||
    m.includes("invalid email or password") ||
    m.includes("invalid credentials")
  );
}

export function readOauthCallbackError(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const err = params.get("error");
  if (!err) return null;
  const desc = params.get("error_description");
  return (
    desc?.replace(/\+/g, " ") ??
    (err === "access_denied"
      ? "Bạn đã hủy đăng nhập Google."
      : "Đăng nhập không thành công.")
  );
}
