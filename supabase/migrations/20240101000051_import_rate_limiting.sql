-- Import rate limiting
-- Adds monthly import counter to user_profiles and an atomic check-and-increment RPC.
-- Free users: 10 imports/month. Premium: unlimited.
-- Counter resets lazily (checked at gate-time, no cron required).
--
-- Security notes:
-- - RPC uses auth.uid() internally (no caller-supplied user ID) to prevent quota exhaustion attacks
-- - new columns are revoked from public select (internal billing state, owner-only)

-- 1. Add columns to user_profiles
alter table public.user_profiles
  add column if not exists monthly_imports_used int4 not null default 0,
  add column if not exists imports_reset_at timestamptz;

-- Revoke column-level select on rate-limit columns from authenticated users.
-- These are internal billing state and must not be visible to other users via the
-- existing "Anyone can view non-hidden user profiles" select policy.
-- The SECURITY DEFINER RPC reads them directly without needing this grant.
revoke select (monthly_imports_used, imports_reset_at)
  on public.user_profiles
  from authenticated;

-- 2. Atomic check-and-increment RPC
-- No p_user_id parameter — uses auth.uid() internally to prevent any user from
-- manipulating another user's quota.
-- SECURITY DEFINER so it can update user_profiles regardless of RLS.
-- Returns: { allowed bool, used int, limit int }
create or replace function public.check_and_increment_import_count()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id       uuid := auth.uid();
  v_plan          text;
  v_used          int4;
  v_reset_at      timestamptz;
  v_limit         int4 := 10;
  v_new_used      int4;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the row to prevent race conditions on parallel import requests
  select plan, monthly_imports_used, imports_reset_at
  into v_plan, v_used, v_reset_at
  from public.user_profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'User profile not found';
  end if;

  -- Premium users: bypass entirely
  if v_plan = 'premium' then
    return jsonb_build_object('allowed', true, 'used', 0, 'limit', 0);
  end if;

  -- Lazy monthly reset: if reset_at is null or in a prior calendar month, reset counter
  if v_reset_at is null
     or date_trunc('month', v_reset_at at time zone 'UTC')
        < date_trunc('month', now() at time zone 'UTC')
  then
    v_used := 0;
    update public.user_profiles
    set monthly_imports_used = 0,
        imports_reset_at = now()
    where id = v_user_id;
  end if;

  -- Check limit
  if v_used >= v_limit then
    return jsonb_build_object('allowed', false, 'used', v_used, 'limit', v_limit);
  end if;

  -- Increment and return new count
  update public.user_profiles
  set monthly_imports_used = monthly_imports_used + 1,
      imports_reset_at = coalesce(imports_reset_at, now())
  where id = v_user_id
  returning monthly_imports_used into v_new_used;

  return jsonb_build_object('allowed', true, 'used', v_new_used, 'limit', v_limit);
end;
$$;

-- Revoke public execute, grant only to authenticated users
revoke execute on function public.check_and_increment_import_count() from public;
grant execute on function public.check_and_increment_import_count() to authenticated;
