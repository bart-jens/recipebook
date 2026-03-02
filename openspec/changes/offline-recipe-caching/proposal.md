## Why

The mobile app has no offline support. In a kitchen with poor WiFi, the app fails completely — no recipes, no ingredients, no steps. This is the single biggest quality-of-life gap for a kitchen app. TanStack Query (tanstack-query-mobile change) provides the caching layer; this change adds persistence of that cache to AsyncStorage so it survives app restarts. Free users get their 20 most recently used recipes cached; premium users get their full library.

## What Changes

- Install `@tanstack/query-async-storage-persister` and configure `persistQueryClient` on top of the QueryClient set up in the tanstack-query-mobile change
- Cache persisted to AsyncStorage under a single key `eefEats-query-cache`
- Cache max age: 7 days (stale but visible; fresh data loads in background when online)
- Free tier: cache is pruned to 20 most recently accessed recipes after each sync
- Premium tier: no pruning — full library cached
- When offline: cached data displays normally; network-only operations (save, rate, etc.) show a toast "You're offline — changes will sync when reconnected" (optimistic UI out of scope for this change)
- Offline indicator: a subtle banner when `NetInfo.isConnected === false`

## Capabilities

### New Capabilities
- `offline-caching`: Persistent AsyncStorage-backed QueryClient cache for the mobile recipe library, with free/premium tier limits

### Modified Capabilities
<!-- None — no spec-level behavior changes beyond what tanstack-query-mobile introduces -->

## Impact

- **New dependencies**: `@tanstack/query-async-storage-persister`, `@tanstack/react-query-persist-client`, `@react-native-community/netinfo`
- **Modified**: `mobile/lib/query-client.ts` — add persister config
- **Modified**: `mobile/app/_layout.tsx` — wrap with `PersistQueryClientProvider` instead of `QueryClientProvider`
- **New file**: `mobile/lib/cache-pruner.ts` — prunes AsyncStorage cache to 20 recipes for free users after sync
- **No DB changes, no web changes**
- **Dependency**: tanstack-query-mobile change must be implemented first
