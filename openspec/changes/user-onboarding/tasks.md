## 1. Database

- [x] 1.1 Create migration: add `username` (unique, nullable) and `onboarded_at` (nullable timestamptz) to `user_profiles`. Add check constraint for username format. Backfill `onboarded_at = now()` for existing users.

## 2. Onboarding Gate

- [x] 2.1 Update authenticated layout to check `onboarded_at` and redirect to `/onboarding` when NULL
- [x] 2.2 Create `/onboarding` page with its own auth check (redirect to `/login` if unauthenticated, redirect to `/recipes` if already onboarded)

## 3. Web Onboarding Screen

- [x] 3.1 Build onboarding UI: display name field (pre-filled), username field (auto-suggested), avatar upload (optional), submit button
- [x] 3.2 Add username validation — format check, uniqueness check on blur, inline errors
- [x] 3.3 Create server action: update profile (display_name, username, avatar_url), set `onboarded_at`, redirect to `/recipes`

## 4. Mobile Onboarding Screen

- [x] 4.1 Build mobile onboarding screen with same fields: display name, username, avatar upload
- [x] 4.2 Add username validation and auto-suggestion on mobile
- [x] 4.3 Add onboarding gate to mobile navigation (redirect un-onboarded users)

## 5. Username Check API

- [x] 5.1 Create API route `/api/username/check` — accepts username, returns `{ available: boolean }` for real-time uniqueness checking from both web and mobile
