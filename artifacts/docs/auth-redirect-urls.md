# Auth redirect URLs (Supabase Dashboard)

Local `supabase/config.toml` lists the same paths for `supabase start`. **Production** must mirror this in:

[Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration)

## Required redirect URLs (exact match)

| Flow | Path |
|------|------|
| Google OAuth + email confirm | `{origin}/auth/callback` |
| Password reset | `{origin}/dat-lai-mat-khau/recovery` |

Register **both** origins if users hit either host:

- `https://ngaylanhthangtot.vn`
- `https://www.ngaylanhthangtot.vn`

## Site URL

Set **Site URL** to the canonical production origin (e.g. `https://www.ngaylanhthangtot.vn`).

## Email signup (PKCE) — critical for `/dang-ky`

The app uses `flowType: "pkce"` (`app/lib/supabase.ts`). Confirmation links must land on:

```text
{origin}/auth/callback?token_hash={{ .TokenHash }}&type=signup
```

### Hosted project checklist

1. **Authentication → Email Templates → Confirm signup**  
   Use the same link as `supabase/templates/confirmation.html` (or paste the anchor from that file).  
   Do **not** rely on the default `{{ .ConfirmationURL }}` only — it may not match the SPA PKCE handler.

2. **Authentication → SMTP**  
   Configure custom SMTP (Resend, SendGrid, etc.). Supabase’s built-in mailer is rate-limited and often lands in spam — users report “no email received”.

3. **Redirect URLs**  
   Include every production origin’s `/auth/callback` (see table above).

4. After deploy, test: sign up → open email → link → `/auth/callback` → `/dang-dung-lich` or `/dang-ky` (birth metadata).

### Resend

Users waiting for mail: `/dang-nhap/email?confirm=pending&email=…` → **Gửi lại email xác nhận**.

## FE sources

- OAuth / signup: `authCallbackRedirectUrl()` → `/auth/callback`
- Reset password: `app/lib/auth-password-reset.ts` → `/dat-lai-mat-khau/recovery`
- Callback handler: `completeAuthCallbackFromUrl()` in `app/lib/auth-post-login.ts`

## QA checklist

- [ ] Signup email link opens `/auth/callback` and lands in app (not “Không đăng nhập được”)
- [ ] Google sign-in from `/dang-nhap` and landing `?ref=` completes
- [ ] Forgot password link opens recovery screen with session
- [ ] Resend confirmation on `/dang-nhap/email?confirm=pending` delivers mail (SMTP configured)
