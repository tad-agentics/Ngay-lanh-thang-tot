-- Referral pairing must run via service_role (Edge referral-claim / handle_new_user trigger only).
-- Migration 20260429120000 revoked PUBLIC but anon/authenticated retained EXECUTE via Supabase defaults.

revoke execute on function public.apply_referral_pair(uuid, uuid) from anon, authenticated, public;
grant execute on function public.apply_referral_pair(uuid, uuid) to service_role;
