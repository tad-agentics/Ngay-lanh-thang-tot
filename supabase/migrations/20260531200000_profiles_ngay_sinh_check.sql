-- Reject nonsense birth dates while allowing NULL (onboarding not yet complete).
alter table public.profiles
  add constraint profiles_ngay_sinh_reasonable
  check (
    ngay_sinh is null
    or (
      ngay_sinh <= current_date
      and ngay_sinh > date '1900-01-01'
    )
  );
