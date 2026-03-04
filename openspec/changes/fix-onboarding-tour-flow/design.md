## Context

The invite funnel currently sends new users through web signup → web onboarding (profile setup) → `/recipes`. At that point `onboarded_at` is set. When the same user later opens the mobile app, the `useOnboardingCheck` hook in `(tabs)/_layout.tsx` finds `onboarded_at != NULL` and skips mobile onboarding entirely — which also means the feature tour never plays. There is also no point in the web journey that suggests downloading the app.

Three things are broken:
1. Web signup routes through an implicit redirect chain (`/recipes` → layout → `/onboarding`) instead of directly
2. Web onboarding has no exit moment for mobile — users land on `/recipes` with no "get the app" prompt
3. The mobile feature tour is gated behind mobile onboarding completion, which web-signup users never reach

## Goals / Non-Goals

**Goals:**
- Web signup takes users directly to `/onboarding`
- Web onboarding ends with a polished "Get the app" screen before proceeding to `/recipes`
- Mobile tour plays for all users on their first mobile launch, regardless of which platform they onboarded on
- Mobile onboarding (for Apple Sign-In / direct mobile users) still works and still leads into the tour

**Non-Goals:**
- Deep linking from web to mobile app (deferred; no universal links configured)
- Android App Store support (iOS only for now)
- Tracking whether users came from web vs. mobile for analytics (future)
- Changes to the tour content itself

## Decisions

### 1. "Get the app" as a dedicated page, not an inline state

**Decision:** Create `src/app/onboarding/get-the-app/page.tsx` as a standalone Next.js page, reached via server redirect from `completeOnboarding`.

**Rationale:** The web app uses server actions with `redirect()`. A success state embedded in the onboarding form would require client-side navigation, adding complexity. A dedicated server-rendered page is simpler, has a clean URL, and lets users bookmark or share it. The page is outside `(authenticated)/layout.tsx` (which is the protected group), so no routing conflicts arise.

**Alternative considered:** Show a modal/sheet overlay on the onboarding page after submit. Rejected: modal state is lost on refresh, doesn't work well with server actions.

### 2. Tour check decoupled in `(tabs)/_layout.tsx` via a new hook

**Decision:** Add `useTourCheck()` alongside `useOnboardingCheck()` in the tabs layout. Both run in parallel. Priority in render: `needsOnboarding` → `/onboarding`, then `needsTour` → `/tour`, then show tabs.

```
useOnboardingCheck(userId)  ─┐
                              ├─ wait until both resolved ─ priority gate ─ render
useTourCheck()              ─┘
```

**Rationale:** AsyncStorage reads are fast (<5ms typically); running them in parallel with the Supabase profile query keeps the loading window minimal. The existing spinner (`ActivityIndicator`) already covers this delay. No new loading UI needed.

**Alternative considered:** Sequential checks (first onboarding, then tour). Rejected: adds latency for no benefit.

**Alternative considered:** Check tour in `mobile/app/_layout.tsx` (root). Rejected: root layout has no session context; would need to duplicate auth checks.

### 3. Mobile onboarding no longer checks `isTourSeen()` on submit

**Decision:** `mobile/app/onboarding.tsx:handleSubmit` navigates to `/(tabs)` directly after saving. The tour check in `(tabs)/_layout.tsx` handles the redirect.

**Rationale:** Single responsibility. The onboarding screen's job is to save the profile. The tabs layout's job is to gate entry. This removes the duplication that would occur if both places checked tour state.

### 4. "Get the app" page: App Store link via environment variable

**Decision:** App Store URL stored in `NEXT_PUBLIC_APP_STORE_URL`. If not set, the button links to `https://apps.apple.com` as a fallback.

**Rationale:** The App Store ID isn't confirmed yet (app not yet submitted). Using an env var means no code change is needed once the URL is known — just a Vercel env update.

### 5. Web onboarding guard remains unchanged

**Decision:** Do NOT change `src/app/(authenticated)/layout.tsx`. The guard (`!onboarded_at → redirect /onboarding`) stays in place as a safety net.

**Rationale:** It's correct behavior and now aligns with the direct redirect from `signup/actions.ts`. Removing it would create a gap if someone lands on `/recipes` before onboarding (e.g., bookmarked link, OAuth edge case).

## Risks / Trade-offs

- [Users who are already onboarded and open a new device] → tour will play on every new device install (AsyncStorage is device-local). This is **intentional and desirable** — the tour is a short feature walkthrough, not a one-time-ever gate.
- [App Store URL not configured in production] → button links to `apps.apple.com` root. Mitigation: set env var before launch.
- [Web signup already redirects to `/recipes`, layout catches it] → changing to direct `/onboarding` redirect removes one round-trip. No user-visible regression; the outcome is the same but faster.
- [Race: user completes web onboarding and immediately opens mobile] → `onboarded_at` is set, tour check fires immediately. Works correctly.

## Migration Plan

1. Deploy web changes (signup redirect + onboarding completion redirect + new get-the-app page) — no DB changes needed
2. Deploy mobile app with decoupled tour check (next TestFlight build)
3. Update `NEXT_PUBLIC_APP_STORE_URL` in Vercel once the App Store listing is live

No rollback complexity — all changes are additive redirects or new pages.
