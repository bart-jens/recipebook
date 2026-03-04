## Why

New users who join via the invite link complete profile onboarding on the web, which sets `onboarded_at` — so when they open the mobile app for the first time, the feature tour never plays and there is no moment to prompt them to download the app. The invite funnel ends with users dropped into a recipe list with no orientation and no clear path to mobile.

## What Changes

- Web signup action redirects directly to `/onboarding` instead of `/recipes` (removes the implicit redirect chain through the authenticated layout)
- Web onboarding completion shows a dedicated "Get the app" screen before redirecting to `/recipes`, with App Store link and a clear value proposition for mobile
- Mobile feature tour is decoupled from profile onboarding: `(tabs)/_layout.tsx` checks `isTourSeen()` independently of `onboarded_at`, so the tour plays on first mobile launch regardless of which platform the user onboarded on
- Mobile onboarding screen remains as-is for users who never went through web (Apple Sign-In new users); after they complete it, the tour still plays

## Capabilities

### New Capabilities
- `app-download-cta`: After completing web onboarding, a "Get the app" screen is shown with App Store link, app screenshot/preview, and a skip option. This is the primary moment where web-signup users are funneled to mobile.

### Modified Capabilities
- `user-onboarding`: Completing web onboarding no longer redirects immediately to `/recipes` — it shows the app download screen first. Web signup action routes directly to `/onboarding`. Mobile tour is decoupled: checked separately in `(tabs)/_layout.tsx`, plays for all users on first mobile launch.

## Impact

- `src/app/signup/actions.ts` — change redirect target from `/recipes` to `/onboarding`
- `src/app/onboarding/actions.ts` — change post-onboarding redirect to `/onboarding/get-the-app` (new page)
- `src/app/onboarding/get-the-app/page.tsx` — new page (app download CTA)
- `mobile/app/(tabs)/_layout.tsx` — add `useTourCheck` hook alongside `useOnboardingCheck`; redirect to `/tour` if tour not yet seen
- `mobile/app/onboarding.tsx` — remove `isTourSeen()` check from `handleSubmit`; always navigate to `/(tabs)` after completion (tour check in tabs layout handles it)
- No DB schema changes required
- No new migrations required
