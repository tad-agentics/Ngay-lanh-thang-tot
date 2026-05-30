-- Server-side day luận chat threads (follow-up Q/A scoped to one day_iso).

create table public.day_luan_threads (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  day_iso           date not null,
  birth_revision    text not null default '',
  luan_context      jsonb not null,
  anchor_reading    text not null default '',
  messages          jsonb not null default '[]'::jsonb,
  follow_up_count   int not null default 0 check (follow_up_count >= 0 and follow_up_count <= 10),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, day_iso, birth_revision)
);

create index idx_day_luan_threads_user_day
  on public.day_luan_threads (user_id, day_iso desc);

alter table public.day_luan_threads enable row level security;

create policy "Users read own day luan threads"
  on public.day_luan_threads for select
  using (auth.uid() = user_id);

comment on table public.day_luan_threads is
  'Frozen luan_context + follow-up messages per user/day; writes via day-luan-chat Edge only.';

comment on column public.day_luan_threads.luan_context is
  'Compact DayLuanPromptContext JSON — frozen at thread open.';

comment on column public.day_luan_threads.messages is
  'Array of {role: user|assistant, content: string} — follow-up turns only (not anchor).';
