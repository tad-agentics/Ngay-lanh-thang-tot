-- Align van_trinh_nam_deliveries SELECT with canUseTieuVanReading (11+ month sub OR addon).

drop policy if exists "Users select own van trinh nam when entitled"
  on public.van_trinh_nam_deliveries;

create policy "Users select own van trinh nam when entitled"
  on public.van_trinh_nam_deliveries for select
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
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
    )
  );
