## 1. Database Migration

- [x] 1.1 Write migration `20240101000055_add_invite_token_to_user_profiles.sql`: add `invite_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()` column to `user_profiles`, backfill all existing rows, and update the `user_profiles` SELECT RLS policy so other users cannot read `invite_token` (use a view or column-level restriction via the policy)
- [x] 1.2 Run `rls-auditor` agent on the new migration to confirm no policy leaks `invite_token` to other users

## 2. Web — Invite Link Route Handler

- [x] 2.1 Create `src/app/i/[token]/route.ts` as a Next.js Route Handler (GET): look up `user_profiles` by `invite_token` using the service role key; if not found redirect to `/signup`; generate a fresh 8-char code, insert into `invites` table with `invited_by` and `code`, redirect `307` to `/signup?code=<code>`
- [x] 2.2 Add `/i/` to the public routes list in `src/lib/supabase/middleware.ts` so unauthenticated visitors are not redirected to login

## 3. Mobile — Copy Invite Link

- [x] 3.1 In `mobile/app/invites.tsx`, fetch the current user's `invite_token` from `user_profiles` on mount (select `invite_token` for `auth.uid()`)
- [x] 3.2 Add a "Copy invite link" button above the existing invite list that writes `https://eefeats.com/i/<invite_token>` to the clipboard using `expo-clipboard` and shows a brief "Link copied" toast/alert
