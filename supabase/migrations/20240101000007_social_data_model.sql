-- ============================================
-- Social Data Model Migration
-- Adds: user_profiles, creator_profiles, user_follows,
--        creator_subscriptions, invites, recipe_analytics
-- Modifies: recipes (visibility, forking, sponsored)
-- Updates: RLS policies for social model
-- ============================================

-- ------------------------------------------
-- 1. Extend recipes table
-- ------------------------------------------
alter table public.recipes
  add column visibility text not null default 'private'
    check (visibility in ('private', 'public', 'subscribers')),
  add column forked_from_id uuid references public.recipes(id) on delete set null,
  add column published_at timestamptz,
  add column sponsored boolean not null default false,
  add column sponsor_metadata jsonb;

-- Index for public recipe discovery
create index recipes_visibility_idx on public.recipes(visibility) where visibility = 'public';
create index recipes_forked_from_idx on public.recipes(forked_from_id) where forked_from_id is not null;

-- ------------------------------------------
-- 2. User profiles
-- ------------------------------------------
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'creator', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_updated_at();

-- ------------------------------------------
-- 3. Creator profiles (extends user_profiles)
-- ------------------------------------------
create table public.creator_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tagline text,
  website_url text,
  social_links jsonb not null default '{}',
  is_verified boolean not null default false,
  subscriber_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------
-- 4. User follows
-- ------------------------------------------
create table public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

create index user_follows_follower_idx on public.user_follows(follower_id);
create index user_follows_following_idx on public.user_follows(following_id);

-- ------------------------------------------
-- 5. Creator subscriptions
-- ------------------------------------------
create table public.creator_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (subscriber_id, creator_id)
);

-- ------------------------------------------
-- 6. Invites
-- ------------------------------------------
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code text not null unique,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index invites_code_idx on public.invites(code);

-- ------------------------------------------
-- 7. Recipe analytics (start collecting early)
-- ------------------------------------------
create table public.recipe_analytics (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'cook', 'fork', 'share')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index recipe_analytics_recipe_idx on public.recipe_analytics(recipe_id);
create index recipe_analytics_created_idx on public.recipe_analytics(created_at);

-- ------------------------------------------
-- 8. RLS on new tables
-- ------------------------------------------
alter table public.user_profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.user_follows enable row level security;
alter table public.creator_subscriptions enable row level security;
alter table public.invites enable row level security;
alter table public.recipe_analytics enable row level security;

-- User profiles: anyone can read, only owner can write
create policy "Anyone can view user profiles"
  on public.user_profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Creator profiles: anyone can read, only owner can write
create policy "Anyone can view creator profiles"
  on public.creator_profiles for select
  using (true);

create policy "Creators can insert own profile"
  on public.creator_profiles for insert
  with check (auth.uid() = id);

create policy "Creators can update own profile"
  on public.creator_profiles for update
  using (auth.uid() = id);

-- User follows: anyone can read, users manage their own follows
create policy "Anyone can view follows"
  on public.user_follows for select
  using (true);

create policy "Users can follow others"
  on public.user_follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.user_follows for delete
  using (auth.uid() = follower_id);

-- Creator subscriptions: subscriber and creator can view, subscriber manages
create policy "Subscribers can view own subscriptions"
  on public.creator_subscriptions for select
  using (auth.uid() = subscriber_id or auth.uid() = creator_id);

create policy "Users can subscribe"
  on public.creator_subscriptions for insert
  with check (auth.uid() = subscriber_id);

create policy "Users can manage own subscription"
  on public.creator_subscriptions for update
  using (auth.uid() = subscriber_id);

-- Invites: users can see and create their own invites
create policy "Users can view own invites"
  on public.invites for select
  using (auth.uid() = invited_by);

create policy "Users can create invites"
  on public.invites for insert
  with check (auth.uid() = invited_by);

-- Recipe analytics: insert-only for authenticated users, no read (admin only via service key)
create policy "Authenticated users can log analytics"
  on public.recipe_analytics for insert
  with check (auth.uid() is not null);

-- ------------------------------------------
-- 9. Update recipe RLS for social model
-- Add policies for public recipe visibility
-- (existing owner-only policies remain unchanged)
-- ------------------------------------------

-- Anyone can view public recipes
create policy "Anyone can view public recipes"
  on public.recipes for select
  using (visibility = 'public');

-- Anyone can view public recipe ingredients
create policy "Anyone can view public recipe ingredients"
  on public.recipe_ingredients for select
  using (exists (
    select 1 from public.recipes
    where id = recipe_id and visibility = 'public'
  ));

-- Anyone can view public recipe tags
create policy "Anyone can view public recipe tags"
  on public.recipe_tags for select
  using (exists (
    select 1 from public.recipes
    where id = recipe_id and visibility = 'public'
  ));

-- Anyone can view public recipe images
create policy "Anyone can view public recipe images"
  on public.recipe_images for select
  using (exists (
    select 1 from public.recipes
    where id = recipe_id and visibility = 'public'
  ));

-- Anyone can view and add ratings on public recipes
create policy "Anyone can view public recipe ratings"
  on public.recipe_ratings for select
  using (exists (
    select 1 from public.recipes
    where id = recipe_id and visibility = 'public'
  ));

create policy "Users can rate public recipes"
  on public.recipe_ratings for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes
      where id = recipe_id and visibility = 'public'
    )
  );

create policy "Users can delete own ratings on public recipes"
  on public.recipe_ratings for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes
      where id = recipe_id and visibility = 'public'
    )
  );

-- Subscribers can view subscribers-only recipes
create policy "Subscribers can view subscribers-only recipes"
  on public.recipes for select
  using (
    visibility = 'subscribers'
    and exists (
      select 1 from public.creator_subscriptions
      where subscriber_id = auth.uid()
        and creator_id = recipes.created_by
        and status = 'active'
    )
  );

-- Subscribers can view subscribers-only recipe child data
create policy "Subscribers can view subscribers-only recipe ingredients"
  on public.recipe_ingredients for select
  using (exists (
    select 1 from public.recipes r
    join public.creator_subscriptions cs on cs.creator_id = r.created_by
    where r.id = recipe_id
      and r.visibility = 'subscribers'
      and cs.subscriber_id = auth.uid()
      and cs.status = 'active'
  ));

create policy "Subscribers can view subscribers-only recipe tags"
  on public.recipe_tags for select
  using (exists (
    select 1 from public.recipes r
    join public.creator_subscriptions cs on cs.creator_id = r.created_by
    where r.id = recipe_id
      and r.visibility = 'subscribers'
      and cs.subscriber_id = auth.uid()
      and cs.status = 'active'
  ));
