## 1. Code Hygiene (mobile)

- [x] 1.1 Remove inline `formatTimeAgo` and `formatTime` from `mobile/app/(tabs)/index.tsx` and import from `mobile/lib/format.ts`

## 2. Standalone Cook Log (mobile)

- [x] 2.1 Add "Cooked It" button to mobile recipe detail with date picker (default today) and notes field
- [x] 2.2 On submit, insert row into `recipe_ratings` (cooked_date, notes; rating null)
- [x] 2.3 Render cook history list below recipe body (entries ordered by cooked_date DESC)
- [x] 2.4 Add delete action to each cook history entry (removes row from recipe_ratings)
- [x] 2.5 Add delete action on star rating (sets rating = null or deletes row if no other data)

## 3. Alphabetical Grocery View (web)

- [x] 3.1 Extract `mergeByIngredient` logic from mobile shopping-list into a standalone function and port it to the web shopping list page
- [x] 3.2 Add "Per recipe" / "Alphabetical" toggle to web shopping list
- [x] 3.3 Render Alphabetical view with merged, A-Z sorted items and recipe attribution
- [x] 3.4 Persist selected view to localStorage and restore on page load

## 4. Import Rate Limit UI (web)

- [x] 4.1 Fetch current import usage on mount in URL import page and display "X of 10 imports used this month." banner for free users
- [x] 4.2 Add 429 handling to URL import page: show upgrade prompt instead of generic error
- [x] 4.3 Apply same usage banner and 429 handling to photo import page

## 5. Photo Carousel (mobile)

- [x] 5.1 Query `recipe_images` table on mobile recipe detail (ordered is_primary DESC, created_at ASC)
- [x] 5.2 Render swipeable horizontal FlatList (paged) when multiple images exist
- [x] 5.3 Show dot page indicator when carousel has more than one image
- [x] 5.4 Show static image when only one image; show nothing when no images

## 6. Collection Picker (mobile)

- [x] 6.1 Add "Add to collection" button to mobile recipe detail (visible to recipe owner only)
- [x] 6.2 Build bottom sheet (Modal + slide animation) listing the user's collections with checkmarks
- [x] 6.3 Wire toggle: tap unchecked collection → insert collection_recipes row; tap checked → delete row
- [x] 6.4 Show empty state with "Create a collection" action when user has no collections

## 7. Web Onboarding + App Tour

- [x] 7.1 Create web `/onboarding` page at `src/app/(authenticated)/onboarding/page.tsx` — profile setup form matching mobile (display_name, username availability check, avatar upload, sets `onboarded_at`)
- [x] 7.2 Change signup `actions.ts` to redirect to `/onboarding` instead of `/recipes`
- [x] 7.3 In the web onboarding submit handler, after setting `onboarded_at`, check localStorage for `tour_seen`: redirect to `/tour` if absent, else `/recipes`
- [x] 7.4 Create `/src/app/(authenticated)/tour/page.tsx` — full-page 3-slide walkthrough matching mobile content (What is EefEats, Import your recipes, Cook together) with Next/Skip controls
- [x] 7.5 After tour completion or skip, write `tour_seen = true` to localStorage and redirect to `/recipes`
- [x] 7.6 Add guard in web onboarding page: if `onboarded_at` is already set, redirect to `/recipes` immediately (returning users bypass onboarding)

## 8. Collection Search (web)

- [x] 8.1 Add search text input to web collection detail page (shown only when collection has > 3 recipes)
- [x] 8.2 Filter visible recipe list client-side by title (case-insensitive substring) as user types
- [x] 8.3 Show "No recipes match your search" empty state when no results

## 9. Publish Nudge (mobile cooking mode)

- [x] 9.1 On cooking mode completion on mobile, check recipe visibility and source_type
- [x] 9.2 If `visibility = 'private'` and `source_type = 'manual'`, show native Alert: "Share with the community?" with "Publish" / "Not now"
- [x] 9.3 On "Publish", call publish endpoint and dismiss cooking mode after success

## 10. Recipes/Activity Tabs (web public profile)

- [x] 10.1 Add tab navigation strip ("Recipes" / "Activity") to web `profile/[id]` page
- [x] 10.2 Recipes tab: render published recipes list (existing query)
- [x] 10.3 Activity tab: render cook log entries (cooked_date, recipe title, notes) for the profile owner
- [x] 10.4 Respect profile privacy: hide tab content for private profiles from non-followers
