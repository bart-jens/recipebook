-- Shopping lists: tables, RLS, RPC functions
-- Free users get 1 list, premium get unlimited.

-- 1. shopping_lists table
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Shopping List',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_lists_user_id_idx on public.shopping_lists(user_id);

-- updated_at trigger
create or replace function public.update_shopping_list_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shopping_lists_updated_at
  before update on public.shopping_lists
  for each row execute function public.update_shopping_list_timestamp();

-- 2. shopping_list_items table
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  ingredient_name text not null,
  quantity decimal,
  unit text,
  is_checked boolean not null default false,
  recipe_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index shopping_list_items_list_id_idx on public.shopping_list_items(shopping_list_id);

-- 3. RLS on shopping_lists
alter table public.shopping_lists enable row level security;

-- Select: owner only
create policy "Users can view own shopping lists"
  on public.shopping_lists for select
  using (auth.uid() = user_id);

-- Insert: owner only, free tier limit (max 1 for free users)
create policy "Users can create own shopping lists"
  on public.shopping_lists for insert
  with check (
    auth.uid() = user_id
    and (
      -- Premium users: no limit
      exists (
        select 1 from public.user_profiles
        where id = auth.uid() and plan != 'free'
      )
      or
      -- Free users: max 1 list
      (select count(*) from public.shopping_lists where user_id = auth.uid()) < 1
    )
  );

-- Update: owner only
create policy "Users can update own shopping lists"
  on public.shopping_lists for update
  using (auth.uid() = user_id);

-- Delete: owner only
create policy "Users can delete own shopping lists"
  on public.shopping_lists for delete
  using (auth.uid() = user_id);

-- 4. RLS on shopping_list_items (scoped via parent list ownership)
alter table public.shopping_list_items enable row level security;

-- Select: items in user's own lists
create policy "Users can view items in own lists"
  on public.shopping_list_items for select
  using (exists (
    select 1 from public.shopping_lists
    where id = shopping_list_id and user_id = auth.uid()
  ));

-- Insert: items in user's own lists
create policy "Users can add items to own lists"
  on public.shopping_list_items for insert
  with check (exists (
    select 1 from public.shopping_lists
    where id = shopping_list_id and user_id = auth.uid()
  ));

-- Update: items in user's own lists
create policy "Users can update items in own lists"
  on public.shopping_list_items for update
  using (exists (
    select 1 from public.shopping_lists
    where id = shopping_list_id and user_id = auth.uid()
  ));

-- Delete: items in user's own lists
create policy "Users can delete items from own lists"
  on public.shopping_list_items for delete
  using (exists (
    select 1 from public.shopping_lists
    where id = shopping_list_id and user_id = auth.uid()
  ));

-- 5. RPC: add recipe ingredients to shopping list with merge logic
create or replace function public.add_recipe_to_shopping_list(
  p_shopping_list_id uuid,
  p_recipe_id uuid
)
returns setof public.shopping_list_items
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_ingredient record;
  v_existing_id uuid;
begin
  -- Verify ownership
  if not exists (
    select 1 from public.shopping_lists
    where id = p_shopping_list_id and user_id = v_user_id
  ) then
    raise exception 'Shopping list not found or not owned by user';
  end if;

  -- Loop through recipe ingredients and merge
  for v_ingredient in
    select ingredient_name, quantity, unit
    from public.recipe_ingredients
    where recipe_id = p_recipe_id
    order by order_index
  loop
    -- Try to find an existing item with same name and unit
    select id into v_existing_id
    from public.shopping_list_items
    where shopping_list_id = p_shopping_list_id
      and lower(trim(ingredient_name)) = lower(trim(v_ingredient.ingredient_name))
      and (
        (unit is null and v_ingredient.unit is null)
        or lower(trim(unit)) = lower(trim(v_ingredient.unit))
      )
      and quantity is not null
      and v_ingredient.quantity is not null
    limit 1;

    if v_existing_id is not null then
      -- Merge: sum quantity and append recipe_id
      update public.shopping_list_items
      set quantity = quantity + v_ingredient.quantity,
          recipe_ids = case
            when p_recipe_id = any(recipe_ids) then recipe_ids
            else recipe_ids || p_recipe_id
          end
      where id = v_existing_id;
    else
      -- Insert new item
      insert into public.shopping_list_items (
        shopping_list_id, ingredient_name, quantity, unit, recipe_ids
      ) values (
        p_shopping_list_id,
        v_ingredient.ingredient_name,
        v_ingredient.quantity,
        v_ingredient.unit,
        array[p_recipe_id]
      );
    end if;
  end loop;

  -- Return updated items
  return query
    select * from public.shopping_list_items
    where shopping_list_id = p_shopping_list_id
    order by is_checked, created_at;
end;
$$;

-- 6. RPC: clear checked items
create or replace function public.clear_checked_items(p_shopping_list_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Verify ownership
  if not exists (
    select 1 from public.shopping_lists
    where id = p_shopping_list_id and user_id = auth.uid()
  ) then
    raise exception 'Shopping list not found or not owned by user';
  end if;

  delete from public.shopping_list_items
  where shopping_list_id = p_shopping_list_id
    and is_checked = true;
end;
$$;
