## Context

New users get an auto-created profile via the `handle_new_user` trigger (display name from email prefix). They land directly in the app with no prompt to personalize. The `user_profiles` table has `display_name`, `avatar_url`, `bio`, `role`, `plan` but no `username` or onboarding flag. Avatar uploads to the `avatars` Supabase Storage bucket already work (used in profile editing).

## Goals / Non-Goals

**Goals:**
- Single-screen onboarding after first sign-in: display name, username, avatar
- Username as unique @handle for the platform
- Gate authenticated routes until onboarding is complete
- Both web and mobile

**Non-Goals:**
- Multi-step onboarding wizard
- Collecting cooking level, dietary preferences, bio, or date of birth
- Changing the signup flow itself (onboarding happens after signup + sign-in)
- Email verification (already handled by admin API auto-confirm)

## Decisions

### 1. `username` column: unique, lowercase, alphanumeric + underscores

**Decision:** Add `username text unique` to `user_profiles`. Constraint: 3-30 chars, lowercase alphanumeric + underscores only (`^[a-z0-9_]{3,30}$`). Validate on both client and server.

**Why:** Simple rules, easy to type, no confusion with display name. 3 char minimum allows short handles.

### 2. `onboarded_at` column as the gate

**Decision:** Add `onboarded_at timestamptz` (nullable, default NULL) to `user_profiles`. NULL = not onboarded. The authenticated layout checks this and redirects to `/onboarding`.

**Why not a boolean?** A timestamp is equally cheap and gives us data on when users completed onboarding. Useful for cohort analysis later.

### 3. Onboarding page outside the gated layout

**Decision:** Create `/onboarding` as a standalone page (not inside the `(authenticated)` layout group that has the nav header). It has its own auth check but skips the onboarding redirect (to avoid loops). The `(authenticated)` layout adds a redirect to `/onboarding` when `onboarded_at` is NULL.

**Why:** The onboarding screen should feel like a focused moment, not a page inside the app. No nav header, no distractions.

### 4. Auto-suggest username from display name

**Decision:** Client-side: when user types their display name, auto-generate a username suggestion (lowercase, strip non-alphanumeric, replace spaces with underscores). User can edit it. Check uniqueness on blur/submit via server.

### 5. Avatar upload reuses existing infrastructure

**Decision:** Same `avatars` bucket, same upload pattern as profile edit. Optional during onboarding — users can skip and add later.

### 6. Backfill existing users

**Decision:** Migration sets `onboarded_at = now()` for all existing users so they skip onboarding. Only truly new users (after this migration) will see the onboarding screen. Username stays NULL for existing users — they can set it from profile edit later.

## Risks / Trade-offs

- **[Username uniqueness races]** → Use DB unique constraint as final guard. Client-side check is advisory.
- **[Existing users have no username]** → Username remains optional in the schema (nullable). Features that need @handles gracefully fall back to display name.
- **[Redirect loop risk]** → Onboarding page must NOT be inside the authenticated layout that does the onboarding check. Separate route group.
