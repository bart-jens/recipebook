-- Add last_cooked_at to user_profiles, maintained by trigger.
-- This allows the chefs overview to show accurate last-cooked dates
-- without being blocked by RLS on cook_log (which only exposes public-recipe
-- cooks to other users, causing stale/incorrect dates for chefs who recently
-- cooked private/imported recipes).

-- 1. Add the column
alter table public.user_profiles
  add column if not exists last_cooked_at timestamptz;

-- 2. Backfill from existing cook_log data
update public.user_profiles p
set last_cooked_at = (
  select max(cooked_at)
  from public.cook_log cl
  where cl.user_id = p.id
);

-- 3. Trigger function: keep last_cooked_at up to date on insert/delete
create or replace function public.update_last_cooked_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.user_profiles
    set last_cooked_at = greatest(last_cooked_at, NEW.cooked_at)
    where id = NEW.user_id;
  elsif (TG_OP = 'DELETE') then
    -- Recalculate on delete (rare operation)
    update public.user_profiles
    set last_cooked_at = (
      select max(cooked_at)
      from public.cook_log
      where user_id = OLD.user_id
    )
    where id = OLD.user_id;
  end if;
  return null;
end;
$$;

create trigger cook_log_update_last_cooked_at
  after insert or delete on public.cook_log
  for each row execute function public.update_last_cooked_at();
