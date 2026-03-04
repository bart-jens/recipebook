-- Drop the two overly-permissive policies on invites:
--   "Anyone can verify invite codes"  — using(true) SELECT exposes all emails + codes
--   "Anyone can mark invites as used" — using(true) WITH CHECK(true) UPDATE lets any
--     authenticated user tamper with any invite row
--
-- Both operations now go through server-side route handlers / server actions that
-- use the admin client (service-role), which bypasses RLS. No user-facing direct
-- table access to invites is required.

drop policy if exists "Anyone can verify invite codes" on public.invites;
drop policy if exists "Anyone can mark invites as used" on public.invites;
