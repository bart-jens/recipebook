## Context

TanStack Query v5 ships with an official persistence plugin: `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister`. Together they serialize the entire QueryClient cache to AsyncStorage on every cache mutation and restore it on app startup. This is the standard pattern for offline-first React Native apps.

The free/premium split (20 recipes vs full library) requires a cache pruning step. After each successful network fetch of the recipes list, a pruner runs and removes cached recipe detail queries for recipes outside the most recently accessed 20 (for free users).

## Goals / Non-Goals

**Goals:**
- Recipes list and detail pages work offline using persisted cache
- App startup feels instant (cache restored before first render)
- Free users: 20 most recently accessed recipes are available offline
- Premium users: full library available offline
- A visible offline indicator when network is unavailable

**Non-Goals:**
- Offline writes (saving edits, ratings, favorites while offline) — complex conflict resolution, out of scope
- Syncing cache invalidations across devices — not needed at current scale
- Custom sync UI / progress bar — beyond scope
- Background sync when app is backgrounded — expo-background-fetch complexity, deferred

## Decisions

**D1: `PersistQueryClientProvider` wraps the whole app**
Replaces `QueryClientProvider` in `_layout.tsx`. Accepts `persister` (AsyncStorage-backed) and `persistOptions` (maxAge: 7 days, buster: app version for cache-busting on major updates).

**D2: Cache key `eefEats-v1`**
Prefixed with version so a cache format change can be busted by incrementing the version string in `query-client.ts`.

**D3: Free tier pruning via `onSuccess` callback**
After the recipes list query succeeds, check `userPlan`. If `free`, collect all `['recipe', id]` cache entries. Sort by `updatedAt` (from the recipe data). Remove entries beyond the 20 most recent. Implemented in `mobile/lib/cache-pruner.ts`, called from the recipes list `useQuery` `onSuccess` option.

**D4: `NetInfo` for offline detection**
`@react-native-community/netinfo` provides `useNetInfo()` hook. When `isConnected === false`, a thin banner at the top of affected screens reads "No internet — showing cached recipes". Banner is conditional on `!isConnected && data !== undefined` (i.e., there IS cached data to show).

**D5: Offline failure state when no cache exists**
If a query fails AND there is no cached data (e.g., first launch with no WiFi), the standard `isError` state is shown: "Could not load recipes. Check your connection and retry."

## Risks / Trade-offs

[Risk] AsyncStorage serialization of large recipe caches could be slow → Mitigation: TanStack Query persister only serializes on cache changes, not every render. For premium users with large libraries, initial persist may take 100-200ms — acceptable.

[Risk] Cache version buster clears all data on update → Mitigation: only increment `buster` on breaking schema changes, not every release.

[Risk] Free tier pruning removes recipes user might want → Mitigation: 20 is a reasonable threshold (survey: Paprika premium is $4.99/yr; our free tier being useful but limited is the right value proposition).

## Migration Plan

1. Install dependencies
2. Add `createAsyncStoragePersister` to `query-client.ts`
3. Switch `QueryClientProvider` → `PersistQueryClientProvider` in `_layout.tsx`
4. Create `cache-pruner.ts` and wire to recipes query
5. Add offline banner component to affected screens
6. Test: airplane mode, open app, confirm cached recipes visible
