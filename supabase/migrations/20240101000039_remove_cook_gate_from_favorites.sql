-- Remove cook_log gate from favorites INSERT policy.
-- Users should be able to favorite any recipe without cooking it first.
-- The UI gate was removed in a0d7fa1 but the RLS policy was not updated,
-- causing silent insert failures and ghost hearts.

drop policy "Users can favorite cooked recipes" on public.recipe_favorites;

create policy "Users can favorite recipes"
  on public.recipe_favorites for insert
  with check (auth.uid() = user_id);
