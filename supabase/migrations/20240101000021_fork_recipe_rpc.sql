-- Fork recipe RPC: atomic fork operation (recipe + ingredients + tags + analytics)
-- Wraps everything in a single transaction so partial failures can't leave orphaned data.

create or replace function public.fork_recipe(source_recipe_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_original record;
  v_new_recipe_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Fetch and validate the original recipe
  select * into v_original
  from public.recipes
  where id = source_recipe_id;

  if v_original is null then
    raise exception 'Recipe not found';
  end if;

  if v_original.visibility != 'public' then
    raise exception 'Can only fork public recipes';
  end if;

  if v_original.created_by = v_user_id then
    raise exception 'Cannot fork your own recipe';
  end if;

  -- Create the forked recipe
  insert into public.recipes (
    title, description, instructions,
    prep_time_minutes, cook_time_minutes, servings,
    image_url, source_type, forked_from_id,
    created_by, visibility
  ) values (
    v_original.title, v_original.description, v_original.instructions,
    v_original.prep_time_minutes, v_original.cook_time_minutes, v_original.servings,
    v_original.image_url, 'fork', source_recipe_id,
    v_user_id, 'private'
  )
  returning id into v_new_recipe_id;

  -- Copy ingredients
  insert into public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit, notes, order_index)
  select v_new_recipe_id, ingredient_name, quantity, unit, notes, order_index
  from public.recipe_ingredients
  where recipe_id = source_recipe_id
  order by order_index;

  -- Copy tags
  insert into public.recipe_tags (recipe_id, tag)
  select v_new_recipe_id, tag
  from public.recipe_tags
  where recipe_id = source_recipe_id;

  -- Log analytics event on the original recipe
  insert into public.recipe_analytics (recipe_id, event_type, user_id)
  values (source_recipe_id, 'fork', v_user_id);

  return v_new_recipe_id;
end;
$$;

-- Allow any authenticated user to call this function
grant execute on function public.fork_recipe(uuid) to authenticated;
