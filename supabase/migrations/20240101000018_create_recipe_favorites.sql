-- recipe_favorites: "this is a go-to recipe" — distinct from saved
-- Gate: user must have cooked the recipe at least once (cook_log entry required)

create table public.recipe_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create index recipe_favorites_user_idx on public.recipe_favorites(user_id);

-- ------------------------------------------
-- RLS
-- ------------------------------------------
alter table public.recipe_favorites enable row level security;

-- Users can favorite recipes they have cooked (cook_log gate)
create policy "Users can favorite cooked recipes"
  on public.recipe_favorites for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.cook_log
      where cook_log.user_id = auth.uid()
        and cook_log.recipe_id = recipe_favorites.recipe_id
    )
  );

-- Users can view their own favorites
create policy "Users can view own favorites"
  on public.recipe_favorites for select
  using (auth.uid() = user_id);

-- Users can unfavorite (delete their own entries)
create policy "Users can unfavorite recipes"
  on public.recipe_favorites for delete
  using (auth.uid() = user_id);
