-- Cache for generate-reading Edge Function (Haiku → plain text, TTL per endpoint in EF).
create table public.reading_cache (
  cache_key text primary key,
  reading text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index idx_reading_cache_expires_at on public.reading_cache (expires_at);

alter table public.reading_cache enable row level security;

-- No policies: anon/authenticated cannot read/write; service_role bypasses RLS.

comment on table public.reading_cache is
  'AI reading cache for generate-reading Edge Function; keyed by SHA256 prefix.';
