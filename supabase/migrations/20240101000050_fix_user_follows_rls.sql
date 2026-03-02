-- Fix: user_follows select policy was using (true), allowing unauthenticated
-- enumeration of the full social graph. Scope to own relationships only.
--
-- Previous policy: "Anyone can view follows" using (true)
--
-- Why only one policy is needed:
-- All direct client queries on user_follows are filtered by the current
-- user's own follower_id or following_id (own follow list, own follower count).
-- Follower/following counts for OTHER users are served entirely by the
-- get_chef_profile SECURITY DEFINER RPC, which bypasses RLS. Adding a second
-- policy for "public profile counts" would expose private users who follow
-- public users — an unnecessary privacy leak for zero benefit.

drop policy if exists "Anyone can view follows" on public.user_follows;

-- Users can only see their own follow relationships (both directions)
create policy "Users can view their own follow relationships"
  on public.user_follows for select
  to authenticated
  using (
    follower_id = auth.uid() or following_id = auth.uid()
  );
