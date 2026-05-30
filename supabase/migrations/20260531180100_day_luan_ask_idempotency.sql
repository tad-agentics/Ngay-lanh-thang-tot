-- Idempotent day-luan ask: safe LLM retry without double-billing / duplicate turns.

create table public.day_luan_ask_idempotency (
  id                uuid primary key default gen_random_uuid(),
  thread_id         uuid not null references public.day_luan_threads (id) on delete cascade,
  idempotency_key   text not null check (char_length(idempotency_key) between 8 and 64),
  question          text not null check (char_length(question) between 1 and 500),
  answer            text,
  status            text not null default 'pending'
                    check (status in ('pending', 'done', 'failed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (thread_id, idempotency_key)
);

create index idx_day_luan_ask_idempotency_thread
  on public.day_luan_ask_idempotency (thread_id, created_at desc);

alter table public.day_luan_ask_idempotency enable row level security;

comment on table public.day_luan_ask_idempotency is
  'Per-submit idempotency for day-luan-chat ask; writes via Edge service_role only.';
