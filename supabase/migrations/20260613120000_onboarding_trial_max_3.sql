-- Reduce never-sub onboarding free chat from 5 → 3 turns.
update public.app_config
set value = '3', updated_at = now()
where config_key = 'onboarding_trial_questions_max';

insert into public.app_config (config_key, value)
values ('onboarding_trial_questions_max', '3')
on conflict (config_key) do update
set value = excluded.value, updated_at = now();
