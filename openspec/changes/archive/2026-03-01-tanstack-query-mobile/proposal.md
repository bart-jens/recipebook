## Why

Every mobile screen fetches data with a manual `useEffect + useState` pattern: set loading=true, call Supabase, set data, set loading=false, catch error. There is no caching — navigating away from a screen and back re-fetches from the network every time. No deduplication of in-flight requests. No stale-while-revalidate. Every screen reinvents the same loading/error pattern with subtle variations. This is the required foundation for offline recipe caching (Sprint 2) and perceived performance improvements (navigation feels instant when data is cached).

## What Changes

- Install `@tanstack/react-query` in the mobile app
- Add `QueryClientProvider` to the root layout (`mobile/app/_layout.tsx`)
- Create `mobile/lib/query-client.ts` with shared `QueryClient` configuration (stale time, cache time, retry policy)
- Create `mobile/lib/queries/` directory with typed query functions for the 4 most-fetched data sets: recipes list, recipe detail, feed (home), and discover
- Migrate `mobile/app/(tabs)/recipes.tsx` from `useEffect+useState` to `useQuery`
- Migrate `mobile/app/(tabs)/index.tsx` (home/feed) from `useEffect+useState` to `useQuery`
- Migrate `mobile/app/recipe/[id]/index.tsx` (recipe detail) from `useEffect+useState` to `useQuery`
- Migrate `mobile/app/(tabs)/discover.tsx` from `useEffect+useState` to `useQuery`
- Keep `useFocusEffect` for cache invalidation on return (screen focus → mark query stale)

## Capabilities

### New Capabilities
- `mobile-data-fetching`: TanStack Query setup, QueryClient config, shared query functions, migration of core screens

### Modified Capabilities
<!-- None — no spec-level behavior changes; implementation detail only -->

## Impact

- **New dependency**: `@tanstack/react-query` + `@tanstack/react-query-devtools` (optional dev tool)
- **New files**: `mobile/lib/query-client.ts`, `mobile/lib/queries/recipes.ts`, `mobile/lib/queries/feed.ts`, `mobile/lib/queries/discover.ts`
- **Modified files**: `mobile/app/_layout.tsx` (add QueryClientProvider), 4 screen files (swap useEffect for useQuery)
- **No DB changes, no API changes, no web changes**
- **Unlocks**: offline caching change can now use `persistQueryClient` on top of this foundation
