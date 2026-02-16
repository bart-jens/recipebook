-- Backfill cook_log from existing recipe_ratings with cooked_date
-- Then drop the is_favorite column from recipes

-- 1. Backfill cook_log from existing ratings
insert into public.cook_log (user_id, recipe_id, cooked_at, notes, created_at)
select
  rr.user_id,
  rr.recipe_id,
  rr.cooked_date::timestamptz,
  rr.notes,
  rr.created_at
from public.recipe_ratings rr
where rr.cooked_date is not null;

-- 2. Drop is_favorite column (no longer needed — replaced by recipe_favorites table)
alter table public.recipes drop column if exists is_favorite;
