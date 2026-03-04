-- Add invite tokens for shareable invite links.
--
-- invite_token is stored in a separate table (not on user_profiles) because
-- user_profiles has a public SELECT policy (using (true)) and PostgreSQL RLS
-- is row-level only — there is no way to hide a single column without a view.
-- A dedicated table gives us proper ownership-scoped access control.

create table public.user_invite_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  invite_token uuid not null unique default gen_random_uuid()
);

alter table public.user_invite_tokens enable row level security;

-- Only the owner can read their own invite token.
create policy "Users can read own invite token"
  on public.user_invite_tokens for select
  using (auth.uid() = user_id);

-- The trigger (below) handles inserts automatically; this covers edge cases.
create policy "Users can insert own invite token"
  on public.user_invite_tokens for insert
  with check (auth.uid() = user_id);

-- Backfill existing users.
insert into public.user_invite_tokens (user_id)
select id from public.user_profiles;

-- Auto-create a token row whenever a new user profile is created.
create or replace function public.create_user_invite_token()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_invite_tokens (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger user_invite_token_on_profile_create
  after insert on public.user_profiles
  for each row execute function public.create_user_invite_token();
