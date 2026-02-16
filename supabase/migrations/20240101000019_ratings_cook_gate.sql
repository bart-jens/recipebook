-- Update recipe_ratings insert policies to require a cook_log entry
-- Every rating on EefEats means someone actually cooked the dish

-- Drop existing insert policies
drop policy if exists "Users can insert own recipe ratings" on public.recipe_ratings;
drop policy if exists "Users can rate public recipes" on public.recipe_ratings;

-- New insert policy: requires cook_log entry for the user+recipe pair
-- Covers both own recipes and public recipes
create policy "Users can rate recipes they have cooked"
  on public.recipe_ratings for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.cook_log
      where cook_log.user_id = auth.uid()
        and cook_log.recipe_id = recipe_ratings.recipe_id
    )
  );
