-- Tra cứu results-screen multi-turn chat (chon-ngay context).

create table public.tra_cuu_results_threads (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  session_key     text not null check (char_length(session_key) between 8 and 128),
  birth_revision  text not null default '',
  pick_context    jsonb not null,
  anchor_intro    text not null default '',
  messages        jsonb not null default '[]'::jsonb,
  follow_up_count int not null default 0 check (follow_up_count >= 0 and follow_up_count <= 10),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, session_key, birth_revision)
);

create index idx_tra_cuu_results_threads_user
  on public.tra_cuu_results_threads (user_id, updated_at desc);

alter table public.tra_cuu_results_threads enable row level security;

create policy "Users read own tra cuu results threads"
  on public.tra_cuu_results_threads for select
  using (auth.uid() = user_id);

revoke all on table public.tra_cuu_results_threads from anon, authenticated;

comment on table public.tra_cuu_results_threads is
  'Multi-turn Tra cứu results chat; writes via tra-cuu-results-chat Edge only.';

create table public.tra_cuu_results_ask_idempotency (
  id                uuid primary key default gen_random_uuid(),
  thread_id         uuid not null references public.tra_cuu_results_threads (id) on delete cascade,
  idempotency_key   text not null check (char_length(idempotency_key) between 8 and 64),
  question          text not null check (char_length(question) between 1 and 500),
  answer            text,
  status            text not null default 'pending'
                    check (status in ('pending', 'done', 'failed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (thread_id, idempotency_key)
);

create index idx_tra_cuu_results_ask_idempotency_thread
  on public.tra_cuu_results_ask_idempotency (thread_id, created_at desc);

alter table public.tra_cuu_results_ask_idempotency enable row level security;

revoke all on table public.tra_cuu_results_ask_idempotency from anon, authenticated;

comment on table public.tra_cuu_results_ask_idempotency is
  'Idempotency for tra-cuu-results-chat ask; Edge service_role only.';
