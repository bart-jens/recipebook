## Why

The parity rule in CLAUDE.md requires every feature to exist on both web and mobile, but a full audit revealed 10 gaps where features shipped on one platform without the other. These gaps range from a broken cook-log flow on mobile (the only way to log a cook is to complete cooking mode) to a missing merged grocery view on web. Closing them now, before the App Store push, prevents two-class users depending on which platform they use.

## What Changes

- **formatTimeAgo / formatTime inline copies removed** (mobile) — `(tabs)/index.tsx` still has local copies of both functions despite Sprint 0 extracting them to `mobile/lib/format.ts`. Replace with imports.
- **Standalone cook log on mobile** — add a "Cooked It" button to mobile recipe detail with date picker, notes field, cook history list, delete cook entry, and delete rating.
- **Alphabetical grocery view on web** — port the `mergeByIngredient` logic from mobile shopping list to web. Add a "Per recipe / Alphabetical" view toggle.
- **Import rate limit UI on web** — show usage banner on URL and photo import pages; handle HTTP 429 with an upgrade prompt (matching mobile behavior).
- **Photo carousel on mobile recipe detail** — query `recipe_images` table and render a swipeable carousel when multiple photos exist, matching web `PhotoCarousel`.
- **Collection picker on mobile recipe detail** — add an "Add to collection" bottom sheet for recipe owners, matching web `CollectionPicker`.
- **App tour on web** — 3-slide post-onboarding walkthrough after `onboarded_at` is set, matching the mobile `/tour` screen.
- **Collection search on web** — add a search input to the web collection detail page (collections with >3 recipes), matching mobile.
- **Publish nudge on mobile cooking mode** — after completing cooking mode on a private manual recipe, prompt the user to publish, matching web `CookingLog` nudge.
- **Recipes/Activity tabs on web public profile** — add tab navigation to web's `profile/[id]` page matching the mobile public profile layout.

## Capabilities

### New Capabilities
- `cook-log-mobile`: Standalone cook logging on mobile recipe detail (date, notes, history, delete)

### Modified Capabilities
- `cooking-mode`: Publish nudge after cook completion on mobile
- `grocery-list`: Alphabetical merged view on web
- `import-rate-limiting`: Rate limit UI and 429 handling on web import pages
- `recipe-images`: Photo carousel on mobile recipe detail
- `recipe-collections`: Collection picker on mobile recipe detail; collection search on web
- `user-profiles`: Recipes/Activity tabs on web public profile pages

## Impact

- `mobile/app/(tabs)/index.tsx` — remove inline formatTimeAgo/formatTime
- `mobile/app/recipe/[id]/index.tsx` — add cook log section, photo carousel, collection picker
- `mobile/app/recipe/[id]/cooking.tsx` — add publish nudge at completion
- `src/app/(authenticated)/shopping-list/` — add alphabetical view toggle + merge logic
- `src/app/(authenticated)/recipes/import-url/` — add rate limit banner + 429 handling
- `src/app/(authenticated)/recipes/import-photo/` — same as above
- `src/app/(authenticated)/collections/[id]/` — add search input
- `src/app/(authenticated)/profile/[id]/` — add Recipes/Activity tab navigation
- `src/app/(authenticated)/recipes/[id]/` — minor: already has tour, no change
- New page: `src/app/(authenticated)/tour/page.tsx` or modal — web onboarding tour
