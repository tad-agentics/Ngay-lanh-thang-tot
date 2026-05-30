-- Daily cron: delete expired reading_cache rows (generate-reading TTL).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'cron-reading-cache-purge-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'cron-reading-cache-purge-daily',
  '0 18 * * *',
  $$
  select net.http_post(
    url := 'https://hptovpbiwvtngorhdhhm.supabase.co/functions/v1/cron-reading-cache-purge',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
