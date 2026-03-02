## 1. Install Dependencies

- [ ] 1.1 Install `@tanstack/react-query-persist-client` and `@tanstack/query-async-storage-persister` in `mobile/`
- [ ] 1.2 Install `@react-native-community/netinfo` (`npx expo install @react-native-community/netinfo`)

## 2. Configure Persister

- [ ] 2.1 Update `mobile/lib/query-client.ts` — export `createAsyncStoragePersister` configured with key `eefEats-v1` and AsyncStorage
- [ ] 2.2 Update `mobile/app/_layout.tsx` — replace `QueryClientProvider` with `PersistQueryClientProvider`, pass persister and `persistOptions: { maxAge: 1000 * 60 * 60 * 24 * 7 }` (7 days)

## 3. Free Tier Cache Pruning

- [ ] 3.1 Create `mobile/lib/cache-pruner.ts` — export `pruneRecipeCache(queryClient, userPlan, recipes)`: if plan is `'free'`, remove all `['recipe', id]` cache entries for recipes not in the 20 most recently updated
- [ ] 3.2 In `mobile/lib/queries/recipes.ts`, call `pruneRecipeCache` in the `useQuery` `select` or via a side-effect after a successful fetch
- [ ] 3.3 Get user plan from `useAuth()` context or `user_profiles` query (whichever is available in the recipes screen)

## 4. Offline Banner Component

- [ ] 4.1 Create `mobile/components/ui/OfflineBanner.tsx` — displays a thin banner with text "No internet — showing cached recipes"; only visible when `!isConnected`; uses theme tokens for colors
- [ ] 4.2 Add `OfflineBanner` to `mobile/app/(tabs)/recipes.tsx` (show only when `data` exists and `!isConnected`)
- [ ] 4.3 Add `OfflineBanner` to `mobile/app/recipe/[id]/index.tsx`

## 5. Offline Write Guard

- [ ] 5.1 In `mobile/app/recipe/[id]/index.tsx`, check `isConnected` before any write operation (rating submit, favorite toggle, image upload); if offline, show `Alert.alert('You\'re offline', 'Please reconnect to save changes.')`

## 6. Verify

- [ ] 6.1 Manual test (airplane mode): open app, navigate to recipes — confirm cached data shown with banner
- [ ] 6.2 Manual test: restore connection — confirm banner disappears and data refreshes
- [ ] 6.3 Manual test (free user, airplane mode): confirm only up to 20 recipe details are cached
- [ ] 6.4 Manual test: try to rate a recipe offline — confirm alert shown, no crash
- [ ] 6.5 Run `npx tsc --noEmit` in `mobile/` — zero type errors
