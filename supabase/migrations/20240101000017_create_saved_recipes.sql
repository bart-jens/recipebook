-- saved_recipes: bookmarking other users' public recipes into your collection
-- A user's own recipes are implicitly saved by ownership — this is for OTHER users' public recipes

create table public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create index saved_recipes_user_idx on public.saved_recipes(user_id);

-- ------------------------------------------
-- RLS
-- ------------------------------------------
alter table public.saved_recipes enable row level security;

-- Users can save public recipes (not their own — enforced at app level)
create policy "Users can save public recipes"
  on public.saved_recipes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes
      where id = recipe_id and visibility = 'public'
    )
  );

-- Users can view their own saved recipes
create policy "Users can view own saved recipes"
  on public.saved_recipes for select
  using (auth.uid() = user_id);

-- Users can unsave (delete their own entries)
create policy "Users can unsave recipes"
  on public.saved_recipes for delete
  using (auth.uid() = user_id);
