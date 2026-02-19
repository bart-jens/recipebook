-- User feedback table
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  platform text not null,
  app_version text,
  source_screen text,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint feedback_message_not_empty check (length(trim(message)) > 0),
  constraint feedback_status_valid check (status in ('new', 'read', 'resolved')),
  constraint feedback_platform_valid check (platform in ('web', 'mobile'))
);

-- Index for admin queries (newest first, filter by status)
create index idx_feedback_created_at on public.feedback (created_at desc);
create index idx_feedback_status on public.feedback (status);

alter table public.feedback enable row level security;
