## Why

New users land in the app with an auto-generated profile (email prefix as display name, no avatar, no username). There's no prompt to personalize their account, so profiles look empty and the social features feel hollow. A one-screen onboarding step after first sign-in lets users set up their identity before they start using the platform.

## What Changes

- **New `username` column** on `user_profiles` — unique, lowercase, alphanumeric + underscores. Used as the public @handle for profiles and discovery.
- **New `onboarded_at` column** on `user_profiles` — nullable timestamp. NULL means user hasn't completed onboarding.
- **Onboarding screen** — Single page shown after first sign-in (when `onboarded_at` is NULL). Collects: display name (pre-filled from email), username (auto-suggested from display name), avatar (optional upload). Sets `onboarded_at` on submit.
- **Onboarding gate** — Authenticated layout redirects to `/onboarding` when `onboarded_at` is NULL. Onboarding page redirects to `/recipes` when already completed.
- **Both web and mobile** — Same onboarding flow on both platforms.

## Capabilities

### New Capabilities

- `user-onboarding`: Onboarding screen, username field, onboarding gate, avatar upload during onboarding

### Modified Capabilities

- `user-profiles`: Adding `username` and `onboarded_at` columns to user_profiles schema

## Impact

**Database:** New columns (`username` unique, `onboarded_at`) on `user_profiles`. Unique index on username. Update auto-create trigger to leave `onboarded_at` NULL.
**Web:** New `/onboarding` page outside the authenticated layout gate. Layout check for onboarding status.
**Mobile:** New onboarding screen. Navigation guard to redirect un-onboarded users.
**Storage:** Avatar uploads to Supabase Storage (may already exist for profile photos).
