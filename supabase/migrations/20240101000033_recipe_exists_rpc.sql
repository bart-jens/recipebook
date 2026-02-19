-- Helper: check if a recipe exists (bypasses RLS via SECURITY DEFINER).
-- Used by mobile client to distinguish "not found" from "private".

create or replace function public.recipe_exists(p_recipe_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(select 1 from public.recipes where id = p_recipe_id);
$$;
