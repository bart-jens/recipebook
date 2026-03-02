-- Read-only import status RPC
-- The monthly_imports_used and imports_reset_at columns are revoked from authenticated
-- users at the column level (migration 000051). This SECURITY DEFINER function allows
-- the import-status API route to read the user's own counters without bypassing that
-- restriction via direct table access.
--
-- Returns: { used int, limit int, plan text }
create or replace function public.get_import_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_plan     text;
  v_used     int4;
  v_reset_at timestamptz;
  v_limit    int4 := 10;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select plan, monthly_imports_used, imports_reset_at
  into v_plan, v_used, v_reset_at
  from public.user_profiles
  where id = v_user_id;

  if not found then
    raise exception 'User profile not found';
  end if;

  if v_plan = 'premium' then
    return jsonb_build_object('used', 0, 'limit', 0, 'plan', v_plan);
  end if;

  -- Apply lazy monthly reset (read-only view — does not write, matches gate logic)
  if v_reset_at is null
     or date_trunc('month', v_reset_at at time zone 'UTC')
        < date_trunc('month', now() at time zone 'UTC')
  then
    v_used := 0;
  end if;

  return jsonb_build_object('used', v_used, 'limit', v_limit, 'plan', v_plan);
end;
$$;

revoke execute on function public.get_import_status() from public;
grant execute on function public.get_import_status() to authenticated;
