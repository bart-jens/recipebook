-- Add username and onboarding tracking to user_profiles
alter table public.user_profiles
  add column username text unique,
  add column onboarded_at timestamptz;

-- Username format constraint: 3-30 chars, lowercase alphanumeric + underscores
alter table public.user_profiles
  add constraint username_format
  check (username ~ '^[a-z0-9_]{3,30}$');

-- Backfill: mark all existing users as onboarded
update public.user_profiles
set onboarded_at = now()
where onboarded_at is null;
