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

## FE sources

- OAuth / signup: `redirectTo` / `emailRedirectTo` → `` `${window.location.origin}/auth/callback` ``
- Reset password: `app/lib/auth-password-reset.ts` → `` `${origin}/dat-lai-mat-khau/recovery` ``

## QA checklist

- [ ] Signup email link opens `/auth/callback` and lands in app (not “Không đăng nhập được”)
- [ ] Google sign-in from `/dang-nhap` and landing `?ref=` completes
- [ ] Forgot password link opens recovery screen with session
