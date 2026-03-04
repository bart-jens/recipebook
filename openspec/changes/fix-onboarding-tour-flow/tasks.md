## 1. Web: Fix signup redirect

- [ ] 1.1 Change `src/app/signup/actions.ts` redirect from `/recipes` to `/onboarding`

## 2. Web: Fix onboarding completion redirect

- [ ] 2.1 Change `src/app/onboarding/actions.ts:completeOnboarding` redirect from `/recipes` to `/onboarding/get-the-app`

## 3. Web: "Get the app" page

- [ ] 3.1 Create `src/app/onboarding/get-the-app/page.tsx` — server component with auth guard (redirect to `/login` if no user)
- [ ] 3.2 Implement the page UI: logo, headline "You're all set.", mobile pitch copy, App Store badge button, "Continue on web" link
- [ ] 3.3 App Store button uses `NEXT_PUBLIC_APP_STORE_URL` env var with fallback to `https://apps.apple.com`

## 4. Mobile: Decouple tour from onboarding

- [ ] 4.1 Add `useTourCheck()` hook to `mobile/app/(tabs)/_layout.tsx` that reads `isTourSeen()` from AsyncStorage
- [ ] 4.2 Extend the layout loading gate to wait for both `checked` (onboarding) and `tourChecked` (tour)
- [ ] 4.3 Add tour redirect after onboarding check: if `needsTour`, redirect to `/tour`

## 5. Mobile: Simplify onboarding completion

- [ ] 5.1 Remove `isTourSeen()` import and check from `mobile/app/onboarding.tsx:handleSubmit`
- [ ] 5.2 Navigate to `/(tabs)` directly after saving (tour check in tabs layout handles the rest)

## 6. Verify

- [ ] 6.1 TypeScript passes (`npx tsc --noEmit` for web, `npm run typecheck` for mobile)
- [ ] 6.2 All tests pass
- [ ] 6.3 Walk through the full web invite flow: signup → onboarding → get-the-app → continue on web → recipes
- [ ] 6.4 Walk through mobile first-launch: login → tour plays → home tab
- [ ] 6.5 Walk through mobile re-launch: login → tour skipped (already seen) → home tab
