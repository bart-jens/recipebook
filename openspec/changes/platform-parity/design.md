## Context

Ten feature gaps exist between web and mobile, discovered during a pre-App Store parity audit. The gaps span cook logging, grocery views, import rate limiting, photo carousels, collection management, onboarding tours, collection search, cooking-mode nudges, and public profile tabs. All gaps are closing features that already exist on one platform — no new concepts are being introduced.

Current state:
- Mobile shopping list has both "Per recipe" and "Alphabetical" views; web only has per-recipe.
- Mobile import screens show rate limit usage; web import pages do not.
- Web recipe detail has a photo carousel and collection picker; mobile does not.
- Web has a post-onboarding 3-slide tour; mobile has it, but web is missing it.
- Web collection detail has no search; mobile has it above 3 recipes.
- Web cooking log prompts to publish private manual recipes; mobile cooking mode does not.
- Web public profiles have Recipes/Activity tab navigation; mobile does not.
- Mobile recipe detail has no standalone cook log — users must complete cooking mode to log a cook.
- `mobile/app/(tabs)/index.tsx` still has inline `formatTimeAgo`/`formatTime` copies despite Sprint 0 extraction.

## Goals / Non-Goals

**Goals:**
- Full feature parity on all 10 gaps before the App Store push.
- Code shared across platforms wherever it already exists (formatTime, mergeByIngredient logic).
- No new DB migrations required — all data is already accessible.

**Non-Goals:**
- Redesigning any existing UI flows.
- Adding net-new features (nothing here didn't already exist on one platform).
- Offline support or caching for new surfaces.
- Real-time updates for cook log, collections, or profile tabs.

## Decisions

### D1: Cook log on mobile — reuse `recipe_ratings` table
Mobile cook log will write to the existing `recipe_ratings` table (same as web `CookingLog`). Columns used: `cooked_date`, `notes`, `rating`. The mobile UI will mirror the web component: a "Cooked It" button opens a date picker + notes field; below the recipe body the cook history list shows past entries with delete. Deleting a rating from the history also deletes the row entirely (matches web behavior).

*Alternative considered:* A new mobile-only `cook_logs` table. Rejected — the data model already exists and is shared with web.

### D2: Alphabetical grocery view on web — port `mergeByIngredient` from mobile
The merge function lives in `mobile/app/(tabs)/shopping-list.tsx` inline. It will be extracted to a pure function and ported to the web shopping list page. The web toggle will use the same label convention as mobile: "Per recipe" / "Alphabetical". Persistence: `localStorage` for web (matching `AsyncStorage` on mobile).

*Alternative considered:* Server-side merge via a new RPC. Rejected — merge is client-side on mobile, keeping it symmetric avoids round-trips and a migration.

### D3: Import rate limit UI on web — fetch existing counter and show banner
The `check_and_increment_import_count` RPC is already live. Web import pages need to fetch current usage on page load using the Supabase client and display a banner: "X of 10 imports used this month." On API 429, show an upgrade prompt modal matching the mobile pattern. No new API needed.

### D4: Photo carousel on mobile — query `recipe_images` and use FlatList
Web uses a `PhotoCarousel` React component with a horizontal scroll. Mobile will use a horizontal `FlatList` with `pagingEnabled`. When only one image exists, no carousel controls are shown (single image like the current state). Query: `recipe_images` ordered by `is_primary DESC, created_at ASC`.

### D5: Collection picker on mobile — bottom sheet with FlatList
Web uses a `CollectionPicker` component (modal overlay). Mobile will use a bottom sheet (`react-native-bottom-sheet` or a Modal + animated View) listing the user's collections with checkmarks. The "Add to collection" button is shown only to the recipe owner. Toggling a collection adds/removes the recipe from `collection_recipes`.

### D6: App tour on web — full funnel via web onboarding page
Web currently skips onboarding entirely (`signup/actions.ts` redirects to `/recipes`). `onboarded_at` is never set for web users, so any tour trigger relying on it would never fire.

Fix: bring web into parity with the mobile signup funnel:
1. Signup redirects to `/onboarding` (new web page) instead of `/recipes`
2. Web onboarding matches mobile: display_name, username, avatar, sets `onboarded_at`
3. After submit, check `localStorage tour_seen` → redirect to `/tour` or `/recipes`
4. `/tour` is a standalone full-page screen (not a modal overlay on `/recipes`)

*Alternative considered:* Lazy modal on `/recipes` mount checking `onboarded_at`. Rejected — web users never set `onboarded_at`, it would never fire. Also breaks the funnel; the tour should be a deliberate post-profile-setup step, not a pop-up after landing.

### D7: Collection search on web — client-side filter input
Mobile collection detail shows a search input when the collection has more than 3 recipes. Web will add the same: a text input above the recipe list, filtering client-side by recipe title. No new query — the page already fetches all recipes in the collection.

### D8: Publish nudge on mobile — alert after cooking mode completion
When cooking mode ends (user taps "Done" on final step), check if the recipe is `visibility = 'private'` and `source_type = 'manual'`. If so, show an Alert (native) with: "Share with the community?" and options "Publish" / "Not now". "Publish" calls the existing publish endpoint.

### D9: Recipes/Activity tabs on web public profile — tabbed navigation
Web `profile/[id]` currently renders content without tabs. Add a tab navigation strip (underline style, matching web design system) with "Recipes" and "Activity" tabs. Recipes tab shows the user's published recipes. Activity tab shows cook log entries. Both are already fetched individually — restructure into tabs.

## Risks / Trade-offs

- **Cook log date picker on mobile**: React Native has no native date picker in core. `@react-native-community/datetimepicker` is already a transitive dep of Expo — verify before adding. [Risk: missing package] → Check package.json first.
- **Bottom sheet library on mobile**: No bottom sheet library currently in `mobile/package.json`. Will use a `Modal` + slide-up animation to avoid adding a new dependency. [Risk: UX feels heavy] → Acceptable for MVP.
- **Existing web users without `onboarded_at`**: Users who signed up before the onboarding page existed land directly on `/recipes` and will never be pushed through the new onboarding flow. [Risk: broken profile data] → Acceptable for now; existing users can fill in their profiles via settings. The tour will be skipped for them (they already know the product).
- **formatTimeAgo deduplication**: Removing inline copies could expose missing exports if `mobile/lib/format.ts` doesn't export both. [Risk: build error] → Verify exports before removing inline copies.

## Open Questions

None — all decisions are straightforward ports of existing functionality.
