/** Map Supabase sign-in errors to Direction C inline copy (FE-HANDOFF §3.3). */

export const AUTH_CALLBACK_VERIFY_FAILED =
  "Không xác minh được tài khoản. Thử lại hoặc đăng nhập bằng email.";
export const AUTH_CALLBACK_VERIFY_TIMEOUT =
  "Không xác minh được tài khoản trong thời gian chờ. Thử lại.";

export function isInvalidLoginCredentials(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("invalid login credentials") ||
    m.includes("invalid email or password") ||
    m.includes("invalid credentials")
  );
}

export function isEmailNotConfirmed(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("email not confirmed") ||
    m.includes("email_not_confirmed") ||
    m.includes("confirm your email")
  );
}

export function isUserAlreadyRegistered(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("user already registered") ||
    m.includes("already been registered")
  );
}

/** Vietnamese copy for Supabase Auth errors shown in toasts. */
export function mapAuthErrorMessageVi(message: string): string {
  const m = message.toLowerCase();
  if (isInvalidLoginCredentials(message)) {
    return "Sai email hoặc mật khẩu.";
  }
  if (isEmailNotConfirmed(message)) {
    return "Email chưa được xác nhận. Mở link trong thư rồi đăng nhập lại.";
  }
  if (isUserAlreadyRegistered(message)) {
    return "Email này đã có tài khoản. Hãy đăng nhập.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Quá nhiều lần thử. Vui lòng đợi vài phút.";
  }
  if (m.includes("signup is disabled")) {
    return "Đăng ký tạm khóa. Liên hệ hỗ trợ.";
  }
  if (m.includes("expired") || m.includes("otp_expired")) {
    return "Link đã hết hạn. Vào đăng nhập email và chọn Gửi lại email xác nhận.";
  }
  if (
    m.includes("invalid flow state") ||
    m.includes("invalid grant") ||
    m.includes("token") && m.includes("invalid")
  ) {
    return "Link không hợp lệ hoặc đã dùng. Thử Gửi lại email xác nhận.";
  }
  return message;
}

/** `/auth/callback` — prefer mapped Supabase message, else generic copy. */
export function mapAuthCallbackErrorVi(message: string): string {
  const mapped = mapAuthErrorMessageVi(message);
  if (mapped !== message) return mapped;
  return AUTH_CALLBACK_VERIFY_FAILED;
}

export function readOauthCallbackError(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const err = params.get("error");
  if (!err) return null;
  const desc = params.get("error_description");
  if (desc) return mapAuthErrorMessageVi(desc.replace(/\+/g, " "));
  if (err === "access_denied") {
    return "Bạn đã hủy đăng nhập Google.";
  }
  return "Đăng nhập không thành công.";
}
