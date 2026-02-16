-- cook_log: separate table for tracking when users cook a recipe
-- Decoupled from ratings — a user can cook without rating

create table public.cook_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  cooked_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- No unique constraint: users can cook the same recipe many times
-- Index for gate checks (rating + favorite require cook_log entry)
create index cook_log_user_recipe_idx on public.cook_log(user_id, recipe_id);
create index cook_log_recipe_idx on public.cook_log(recipe_id);

-- ------------------------------------------
-- RLS
-- ------------------------------------------
alter table public.cook_log enable row level security;

-- Users can log cooks on their own recipes
create policy "Users can insert cook log for own recipes"
  on public.cook_log for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes
      where id = recipe_id and created_by = auth.uid()
    )
  );

-- Users can log cooks on public recipes
create policy "Users can insert cook log for public recipes"
  on public.cook_log for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes
      where id = recipe_id and visibility = 'public'
    )
  );

-- Users can view their own cook log entries
create policy "Users can view own cook log"
  on public.cook_log for select
  using (auth.uid() = user_id);

-- Users can view cook log entries for public recipes (for activity feed)
create policy "Anyone can view cook log for public recipes"
  on public.cook_log for select
  using (exists (
    select 1 from public.recipes
    where id = recipe_id and visibility = 'public'
  ));

-- Users can delete their own cook log entries
create policy "Users can delete own cook log entries"
  on public.cook_log for delete
  using (auth.uid() = user_id);
