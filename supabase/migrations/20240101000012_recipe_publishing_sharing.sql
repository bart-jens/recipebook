-- ============================================
-- Recipe Publishing & Sharing Migration
-- Adds: source_name to recipes, image_type to recipe_images,
--        recipe_shares table, recipe_share_cards view,
--        import visibility constraint, publish limit trigger
-- ============================================

-- ------------------------------------------
-- 1. Add source_name to recipes
-- ------------------------------------------
alter table public.recipes
  add column source_name text;

-- Partial index for published_at on public recipes (visibility index exists from migration 7)
create index recipes_published_at_idx on public.recipes(published_at) where visibility = 'public';

-- ------------------------------------------
-- 2. CHECK constraint: imported recipes cannot be published
-- ------------------------------------------
alter table public.recipes
  add constraint imported_recipes_stay_private
    check (source_type = 'manual' or source_type = 'fork' or visibility = 'private');

-- ------------------------------------------
-- 3. Backfill source_name from source_url domain
-- ------------------------------------------
update public.recipes
set source_name = case
  when source_url ilike '%seriouseats.com%' then 'Serious Eats'
  when source_url ilike '%bonappetit.com%' then 'Bon Appetit'
  when source_url ilike '%nytimes.com%' or source_url ilike '%cooking.nytimes.com%' then 'NYT Cooking'
  when source_url ilike '%allrecipes.com%' then 'Allrecipes'
  when source_url ilike '%foodnetwork.com%' then 'Food Network'
  when source_url ilike '%epicurious.com%' then 'Epicurious'
  when source_url ilike '%food52.com%' then 'Food52'
  when source_url ilike '%smittenkitchen.com%' then 'Smitten Kitchen'
  when source_url ilike '%budgetbytes.com%' then 'Budget Bytes'
  when source_url ilike '%minimalistbaker.com%' then 'Minimalist Baker'
  when source_url ilike '%halfbakedharvest.com%' then 'Half Baked Harvest'
  when source_url ilike '%cookieandkate.com%' then 'Cookie and Kate'
  when source_url ilike '%thekitchn.com%' then 'The Kitchn'
  when source_url ilike '%tasty.co%' then 'Tasty'
  when source_url ilike '%delish.com%' then 'Delish'
  when source_url ilike '%simplyrecipes.com%' then 'Simply Recipes'
  when source_url ilike '%kingarthurbaking.com%' then 'King Arthur Baking'
  when source_url ilike '%instagram.com%' then 'Instagram'
  -- Fallback: extract domain from URL
  else regexp_replace(
    regexp_replace(source_url, '^https?://(www\.)?', ''),
    '/.*$', ''
  )
end
where source_url is not null
  and source_name is null
  and source_type in ('url', 'instagram');

-- ------------------------------------------
-- 4. Add image_type to recipe_images
-- ------------------------------------------
alter table public.recipe_images
  add column image_type text not null default 'source'
    check (image_type in ('source', 'user_upload'));

-- ------------------------------------------
-- 5. Create recipe_shares table
-- ------------------------------------------
create table public.recipe_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  notes text,
  shared_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

-- Indexes for feed queries
create index recipe_shares_user_shared_idx on public.recipe_shares(user_id, shared_at desc);
create index recipe_shares_recipe_idx on public.recipe_shares(recipe_id);

-- ------------------------------------------
-- 6. RLS on recipe_shares
-- ------------------------------------------
alter table public.recipe_shares enable row level security;

-- Owner can see their own shares
create policy "Users can view own shares"
  on public.recipe_shares for select
  using (auth.uid() = user_id);

-- Followers can see shares from people they follow
create policy "Followers can view shares"
  on public.recipe_shares for select
  using (exists (
    select 1 from public.user_follows
    where follower_id = auth.uid()
      and following_id = recipe_shares.user_id
  ));

-- Only owner can insert shares for their own recipes
create policy "Users can share own recipes"
  on public.recipe_shares for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes
      where id = recipe_id and created_by = auth.uid()
    )
  );

-- Only owner can delete their own shares
create policy "Users can unshare own shares"
  on public.recipe_shares for delete
  using (auth.uid() = user_id);

-- ------------------------------------------
-- 7. recipe_share_cards view
-- Exposes only safe (non-copyrightable) metadata
-- ------------------------------------------
create view public.recipe_share_cards as
select
  rs.id as share_id,
  rs.user_id,
  rs.recipe_id,
  rs.notes as share_notes,
  rs.shared_at,
  r.title,
  r.source_url,
  r.source_name,
  r.source_type,
  r.image_url,
  array_agg(distinct rt.tag) filter (where rt.tag is not null) as tags,
  rr.rating as user_rating
from public.recipe_shares rs
join public.recipes r on r.id = rs.recipe_id
left join public.recipe_tags rt on rt.recipe_id = rs.recipe_id
left join public.recipe_ratings rr on rr.recipe_id = rs.recipe_id and rr.user_id = rs.user_id
group by rs.id, rs.user_id, rs.recipe_id, rs.notes, rs.shared_at,
         r.title, r.source_url, r.source_name, r.source_type, r.image_url,
         rr.rating;

-- ------------------------------------------
-- 8. Publish limit trigger (free users: max 10 public recipes)
-- ------------------------------------------
create or replace function public.enforce_publish_limit()
returns trigger as $$
declare
  user_plan text;
  public_count integer;
begin
  -- Only check when changing visibility to public
  if new.visibility = 'public' and (old.visibility is null or old.visibility != 'public') then
    select plan into user_plan
    from public.user_profiles
    where id = new.created_by;

    if user_plan = 'free' then
      select count(*) into public_count
      from public.recipes
      where created_by = new.created_by
        and visibility = 'public'
        and id != new.id;

      if public_count >= 10 then
        raise exception 'Free users can publish up to 10 recipes. Upgrade to premium for unlimited publishing.';
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_publish_limit_trigger
  before update on public.recipes
  for each row execute function public.enforce_publish_limit();
