-- ============================================
-- Recipe Collections Migration
-- Adds: collections table, collection_recipes junction table,
--        free tier collection limit trigger, RLS policies
-- ============================================

-- ------------------------------------------
-- 1. Collections table
-- ------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collections_user_id_idx on public.collections(user_id);

-- updated_at trigger
create or replace function public.update_collections_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger collections_updated_at
  before update on public.collections
  for each row execute function public.update_collections_updated_at();

-- ------------------------------------------
-- 2. Collection recipes junction table
-- ------------------------------------------
create table if not exists public.collection_recipes (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (collection_id, recipe_id)
);

create index collection_recipes_collection_id_idx on public.collection_recipes(collection_id);
create index collection_recipes_recipe_id_idx on public.collection_recipes(recipe_id);

-- ------------------------------------------
-- 3. RLS: collections (owner-only access)
-- ------------------------------------------
alter table public.collections enable row level security;

-- Users can only view their own collections
create policy "Users can view own collections"
  on public.collections for select
  using (user_id = auth.uid());

-- Users can only create collections for themselves
create policy "Users can create own collections"
  on public.collections for insert
  with check (user_id = auth.uid());

-- Users can only update their own collections
create policy "Users can update own collections"
  on public.collections for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can only delete their own collections
create policy "Users can delete own collections"
  on public.collections for delete
  using (user_id = auth.uid());

-- ------------------------------------------
-- 4. RLS: collection_recipes (scoped to collection owner)
-- ------------------------------------------
alter table public.collection_recipes enable row level security;

-- Users can view recipes in their own collections
create policy "Users can view own collection recipes"
  on public.collection_recipes for select
  using (
    exists (
      select 1 from public.collections
      where collections.id = collection_recipes.collection_id
        and collections.user_id = auth.uid()
    )
  );

-- Users can add recipes to their own collections
create policy "Users can add to own collections"
  on public.collection_recipes for insert
  with check (
    exists (
      select 1 from public.collections
      where collections.id = collection_recipes.collection_id
        and collections.user_id = auth.uid()
    )
  );

-- Users can remove recipes from their own collections
create policy "Users can remove from own collections"
  on public.collection_recipes for delete
  using (
    exists (
      select 1 from public.collections
      where collections.id = collection_recipes.collection_id
        and collections.user_id = auth.uid()
    )
  );

-- ------------------------------------------
-- 5. Free tier collection limit trigger
-- ------------------------------------------
create or replace function public.check_collection_limit()
returns trigger as $$
begin
  if (select plan from public.user_profiles where id = new.user_id) = 'free'
     and (select count(*) from public.collections where user_id = new.user_id) >= 5 then
    raise exception 'Free plan limited to 5 collections. Upgrade to premium for unlimited collections.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_collection_limit
  before insert on public.collections
  for each row execute function public.check_collection_limit();
