## 1. Shared Step Parser

- [x] 1.1 Create `src/lib/parse-steps.ts` with `parseSteps(instructions: string): string[]` — splits on newlines, strips numbered/labelled prefixes, filters empty lines
- [x] 1.2 Create `mobile/lib/parse-steps.ts` with identical logic (same function, separate file for platform isolation)
- [x] 1.3 Write unit tests for parseSteps: numbered list, step-labelled, bare paragraphs, single paragraph, empty string

## 2. Mobile — CookingMode Component

- [x] 2.1 Add `expo-keep-awake` to `mobile/package.json` and install
- [x] 2.2 Create `mobile/components/ui/CookingMode.tsx` — accepts `recipe`, `ingredients`, `steps[]`, `onDismiss`, `onRatingSubmit` props
- [x] 2.3 Implement header: × exit button (top-left), truncated title (center), step counter "N / T" (top-right)
- [x] 2.4 Implement Steps/Ingredients segment control (tap only, no swipe between tabs)
- [x] 2.5 Implement progress bar below segment control (fills proportionally, hidden on Ingredients tab)
- [x] 2.6 Implement Steps body: large muted step label + large step text, single step visible, vertically scrollable
- [x] 2.7 Implement Ingredients body: scrollable ingredient list with unit toggle (metric/imperial), read-only
- [x] 2.8 Implement footer: Previous (ghost, hidden on step 1) + Next (primary, "Done" on last step), 44pt tap targets
- [x] 2.9 Implement completion screen: "You cooked it!" heading, recipe title, optional StarRating row, optional notes TextInput, Save & Finish + Skip buttons
- [x] 2.10 Wire `expo-keep-awake` — `activateKeepAwakeAsync()` on mount, `deactivateKeepAwake()` on unmount
- [x] 2.11 Wire completion: Save & Finish calls `onRatingSubmit` with rating + notes (if stars selected), Skip calls `onDismiss`

## 3. Mobile — Modal Screen

- [x] 3.1 Create `mobile/app/recipe/[id]/cooking.tsx` as a modal route with `presentation: 'fullScreenModal'`
- [x] 3.2 Fetch recipe, ingredients from Supabase using the recipe `id` param
- [x] 3.3 Parse steps from `recipe.instructions` using `parseSteps`
- [x] 3.4 Render `CookingMode` component with fetched data; handle loading and error states
- [x] 3.5 Implement `onRatingSubmit`: insert row into `recipe_ratings` (recipe_id, user_id, rating, notes, cooked_date = today) using existing Supabase client, then dismiss
- [x] 3.6 Dismiss modal on exit (× button) and after completion flow

## 4. Mobile — Entry Point

- [x] 4.1 Add "Start Cooking" button to `mobile/app/recipe/[id]/index.tsx` below the metadata row (prep/cook time, servings)
- [x] 4.2 Hide button when `recipe.instructions` is null or empty
- [x] 4.3 Navigate to `mobile/app/recipe/[id]/cooking` on tap (Expo Router modal push)

## 5. Web — CookingModeOverlay Component

- [x] 5.1 Create `src/components/ui/CookingModeOverlay.tsx` as a fixed-position full-screen overlay (`"use client"`)
- [x] 5.2 Accept props: `recipe`, `ingredients`, `steps[]`, `onDismiss`, `onRatingSubmit`
- [x] 5.3 Implement header: × exit button, truncated title, step counter
- [x] 5.4 Implement Steps/Ingredients tab control
- [x] 5.5 Implement progress bar
- [x] 5.6 Implement Steps body: large step label + large step text, single step visible
- [x] 5.7 Implement Ingredients body: scrollable ingredient list with unit toggle
- [x] 5.8 Implement footer: Previous + Next buttons
- [x] 5.9 Implement completion screen (same flow as mobile)
- [x] 5.10 Implement keyboard navigation: `useEffect` on `keydown` — ArrowRight = next, ArrowLeft = prev, Escape = exit (with confirmation if past step 1)
- [x] 5.11 Implement Web Wake Lock API: `navigator.wakeLock.request('screen')` on mount, release on unmount, graceful degradation if API unavailable
- [x] 5.12 Add `@media (prefers-reduced-motion: reduce)` — disable step transition animations

## 6. Web — Entry Point

- [x] 6.1 Add "Start Cooking" button to the web recipe detail client component
- [x] 6.2 Hide button when `recipe.instructions` is null or empty
- [x] 6.3 On click, render `CookingModeOverlay` with recipe data (steps parsed from instructions)
- [x] 6.4 Wire `onRatingSubmit`: POST to existing rating endpoint or call Supabase directly, then close overlay
- [x] 6.5 Wire `onDismiss`: close overlay

## 7. Platform Parity Check

- [x] 7.1 Run `platform-sync` agent to verify cooking mode is implemented on both web and mobile before committing
- [x] 7.2 Verify "Start Cooking" button visible on both platforms for a recipe with instructions
- [x] 7.3 Verify button hidden on both platforms for a recipe with no instructions
- [x] 7.4 Verify screen keep-awake activates on mobile and web (browser dev tools for web)
- [x] 7.5 Verify completion flow writes to `recipe_ratings` correctly on both platforms
