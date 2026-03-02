## 1. Install and Configure

- [x] 1.1 Install `@tanstack/react-query` in `mobile/` (`npm install @tanstack/react-query`)
- [x] 1.2 Create `mobile/lib/query-client.ts` — export a `QueryClient` singleton with 2-min staleTime, 10-min gcTime, retry: 1
- [x] 1.3 Create `mobile/lib/queries/keys.ts` — export `queryKeys` object with typed keys for recipes, recipeDetail, feed, discover
- [x] 1.4 Add `QueryClientProvider` wrapping children in `mobile/app/_layout.tsx`

## 2. Create Query Functions

- [x] 2.1 Create `mobile/lib/queries/recipes.ts` — `fetchRecipes(userId, search)` returns `RecipeListItem[]`
- [x] 2.2 Create `mobile/lib/queries/recipe-detail.ts` — `fetchRecipeDetail(recipeId, userId)` returns full recipe + ingredients shape
- [x] 2.3 Create `mobile/lib/queries/feed.ts` — `fetchFeed(userId)` returns `FeedData` (feedItems, displayName, suggestions, followingCount, recentCooks)
- [x] 2.4 Create `mobile/lib/queries/discover.ts` — `fetchDiscover(search)` returns `PublicRecipe[]`

## 3. Migrate Screens

- [x] 3.1 Migrate `mobile/app/(tabs)/recipes.tsx` — replace `useEffect+useState` data fetch with `useQuery(queryKeys.recipes(...), fetchRecipes(...))`, update `useFocusEffect` to use `invalidateQueries`, keep UI identical
- [x] 3.2 Migrate `mobile/app/(tabs)/index.tsx` (home/feed) — replace data fetch with `useQuery(queryKeys.feed(...), fetchFeed(...))`
- [x] 3.3 Migrate `mobile/app/recipe/[id]/index.tsx` — replace data fetch with `useQuery(queryKeys.recipeDetail(...), fetchRecipeDetail(...))`
- [x] 3.4 Migrate `mobile/app/(tabs)/discover.tsx` — replace data fetch with `useQuery(queryKeys.discover(...), fetchDiscover(...))`

## 4. Error States

- [x] 4.1 Add error state UI (error message + retry button using `refetch`) to recipes screen when `isError` is true
- [x] 4.2 Add error state UI to home/feed screen
- [x] 4.3 Add error state UI to recipe detail screen
- [x] 4.4 Add error state UI to discover screen

## 5. Verify

- [x] 5.1 Run `npx tsc --noEmit` in `mobile/` — zero new type errors (3 pre-existing errors in import-photo, import-url, auth.tsx — unrelated to this change)
- [ ] 5.2 Manual test: navigate between recipes and detail, confirm no loading spinner on back-navigation (cache hit)
- [ ] 5.3 Manual test: edit a recipe, navigate back, confirm list reflects change (focus invalidation working)
