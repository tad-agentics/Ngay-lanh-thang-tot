-- H3: SQL helpers aligned with Edge canUseBaziReading / canUseTieuVanReading (330-day sub ≈ 11 months).

create or replace function public.profile_can_use_bazi_reading(p_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and (
        p.bazi_reading_unlocked_at is not null
        or (
          p.subscription_expires_at is not null
          and p.subscription_expires_at > now()
          and p.subscription_expires_at >= now() + interval '330 days'
        )
      )
  );
$$;

create or replace function public.profile_can_use_tieu_van_reading(p_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and (
        (
          p.tieu_van_reading_expires_at is not null
          and p.tieu_van_reading_expires_at > now()
        )
        or (
          p.subscription_expires_at is not null
          and p.subscription_expires_at > now()
          and p.subscription_expires_at >= now() + interval '330 days'
        )
      )
  );
$$;

revoke all on function public.profile_can_use_bazi_reading(uuid) from public;
revoke all on function public.profile_can_use_tieu_van_reading(uuid) from public;
grant execute on function public.profile_can_use_bazi_reading(uuid) to authenticated, service_role;
grant execute on function public.profile_can_use_tieu_van_reading(uuid) to authenticated, service_role;

drop policy if exists "Users select own bazi reading deliveries when entitled"
  on public.bazi_reading_deliveries;

create policy "Users select own bazi reading deliveries when entitled"
  on public.bazi_reading_deliveries for select
  using (
    auth.uid() = user_id
    and public.profile_can_use_bazi_reading(auth.uid())
  );

revoke insert, update, delete on table public.bazi_reading_deliveries from anon, authenticated;
grant select on table public.bazi_reading_deliveries to authenticated;

drop policy if exists "Users select own van trinh nam when entitled"
  on public.van_trinh_nam_deliveries;

create policy "Users select own van trinh nam when entitled"
  on public.van_trinh_nam_deliveries for select
  using (
    auth.uid() = user_id
    and public.profile_can_use_tieu_van_reading(auth.uid())
  );
