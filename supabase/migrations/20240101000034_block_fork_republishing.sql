-- Tighten publishing constraint: only truly original recipes can be published.
-- Forks (source_type='fork') and copies with forked_from_id set must stay private.
-- This prevents users from republishing someone else's recipe as their own.

-- Drop old constraint (if it exists) and add stricter one
alter table public.recipes
  drop constraint if exists imported_recipes_stay_private;

alter table public.recipes
  add constraint recipes_publish_rules
    check (
      visibility = 'private'
      or (source_type = 'manual' and forked_from_id is null)
    );

-- Ensure any published forks are unpublished (data safety)
update public.recipes
set visibility = 'private', published_at = null
where visibility = 'public'
  and (source_type != 'manual' or forked_from_id is not null);
