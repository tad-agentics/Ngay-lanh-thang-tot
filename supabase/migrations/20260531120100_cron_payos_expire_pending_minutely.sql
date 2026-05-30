-- G3 — expire pending orders past expires_at (~every minute; was daily @ 24h).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'cron-payos-expire-orphans-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  select jobid into existing_job_id
  from cron.job
  where jobname = 'cron-payos-expire-pending';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'cron-payos-expire-pending',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://hptovpbiwvtngorhdhhm.supabase.co/functions/v1/cron-payos-expire-orphans',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
