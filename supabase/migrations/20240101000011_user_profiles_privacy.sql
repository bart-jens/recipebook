-- ============================================
-- User Profile Privacy & Follow Requests
-- Adds: is_private column, follow_requests table
-- Updates: user_follows insert policy for privacy
-- Adds: avatars storage bucket
-- ============================================

-- ------------------------------------------
-- 1. Add is_private column to user_profiles
-- ------------------------------------------
alter table public.user_profiles
  add column is_private boolean not null default false;

-- ------------------------------------------
-- 2. Follow requests table (for private profiles)
-- ------------------------------------------
create table public.follow_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (requester_id, target_id),
  check (requester_id != target_id)
);

create index follow_requests_requester_idx on public.follow_requests(requester_id);
create index follow_requests_target_idx on public.follow_requests(target_id);

-- ------------------------------------------
-- 3. RLS on follow_requests
-- ------------------------------------------
alter table public.follow_requests enable row level security;

-- Requester or target can see their own requests
create policy "Users can view own follow requests"
  on public.follow_requests for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- Authenticated users can create follow requests for private users
-- only if no existing follow or pending request exists
create policy "Users can request to follow private users"
  on public.follow_requests for insert
  with check (
    auth.uid() = requester_id
    and exists (
      select 1 from public.user_profiles
      where id = target_id and is_private = true
    )
    and not exists (
      select 1 from public.user_follows
      where follower_id = auth.uid() and following_id = target_id
    )
  );

-- Requester can cancel their own request, target can deny
create policy "Users can cancel or deny follow requests"
  on public.follow_requests for delete
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- ------------------------------------------
-- 4. Update user_follows insert policy for privacy
-- Drop existing insert policy and replace with privacy-aware version
-- ------------------------------------------
drop policy if exists "Users can follow others" on public.user_follows;

-- Users can follow public profiles directly,
-- or follow private profiles only via approval (handled by application code
-- that inserts into user_follows when approving a follow request)
create policy "Users can follow public profiles"
  on public.user_follows for insert
  with check (
    auth.uid() = follower_id
    and (
      -- Target is a public profile: direct follow allowed
      exists (
        select 1 from public.user_profiles
        where id = following_id and is_private = false
      )
      -- Target is private: only allow if current user is the target
      -- (i.e. the target is approving a follow request for themselves)
      or auth.uid() = following_id
    )
  );

-- ------------------------------------------
-- 5. Avatars storage bucket
-- (Storage buckets and policies are managed via Supabase Dashboard
-- or via supabase CLI. Including SQL here for documentation.)
-- ------------------------------------------

-- Create the avatars bucket (public for read access)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own avatars
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to all avatars
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
