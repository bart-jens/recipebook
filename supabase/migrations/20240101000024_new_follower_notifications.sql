-- Add last_seen_followers_at to user_profiles
alter table public.user_profiles
  add column last_seen_followers_at timestamptz not null default now();

-- Index for efficient new-follower lookups
create index idx_user_follows_following_created
  on public.user_follows (following_id, created_at desc);

-- Returns count of followers the user hasn't seen yet
create or replace function public.get_new_follower_count(p_user_id uuid)
returns integer
language sql
stable
security definer
as $$
  select count(*)::integer
  from public.user_follows uf
  join public.user_profiles up on up.id = p_user_id
  where uf.following_id = p_user_id
    and uf.created_at > up.last_seen_followers_at;
$$;

-- Returns details of new followers
create or replace function public.get_new_followers(p_user_id uuid)
returns table (
  follower_id uuid,
  display_name text,
  avatar_url text,
  followed_at timestamptz
)
language sql
stable
security definer
as $$
  select
    uf.follower_id,
    prof.display_name,
    prof.avatar_url,
    uf.created_at as followed_at
  from public.user_follows uf
  join public.user_profiles prof on prof.id = uf.follower_id
  join public.user_profiles me on me.id = p_user_id
  where uf.following_id = p_user_id
    and uf.created_at > me.last_seen_followers_at
  order by uf.created_at desc;
$$;

-- Marks all current followers as seen
create or replace function public.mark_followers_seen()
returns void
language sql
security definer
as $$
  update public.user_profiles
  set last_seen_followers_at = now()
  where id = auth.uid();
$$;

grant execute on function public.get_new_follower_count(uuid) to authenticated;
grant execute on function public.get_new_followers(uuid) to authenticated;
grant execute on function public.mark_followers_seen() to authenticated;
