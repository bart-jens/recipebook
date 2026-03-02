## Context

Current state: all 4 primary screens (`recipes`, `index`/home, `recipe/[id]`, `discover`) use identical `useEffect+useState` fetch patterns. `useFocusEffect` re-fetches on every screen visit — no caching at all. The `Recipe` interface is defined locally in each screen file, diverging over time (partially addressed by the domain-type-layer change).

TanStack Query v5 (React Query) is the standard solution for this class of problem in React/React Native. It is well-tested with Expo and Supabase.

## Goals / Non-Goals

**Goals:**
- Install and configure TanStack Query with sensible defaults for a mobile recipe app
- Migrate the 4 primary data-fetching screens to `useQuery`
- Queries are invalidated on screen focus (so data refreshes when navigating back, but from cache on re-render)
- Consistent loading/error/success state handling across all screens
- Typed query functions in `mobile/lib/queries/` (each returns the domain type from `shared/types/domain.ts`)

**Non-Goals:**
- Offline persistence (`persistQueryClient` + AsyncStorage) — that is the offline-caching change
- Migrating mutation operations (save, rate, favorite) to `useMutation` — low priority, can follow later
- Server-side / RSC patterns — this is mobile only
- Installing React Query DevTools in production

## Decisions

**D1: QueryClient config**
```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min — data is fresh for 2 min
      gcTime: 1000 * 60 * 10,      // 10 min — keep in memory for 10 min
      retry: 1,
      refetchOnWindowFocus: false, // not applicable on mobile
    },
  },
})
```
2-minute stale time balances freshness vs unnecessary network hits. Navigating back within 2 minutes serves from cache instantly.

**D2: Query keys as typed constants**
```ts
export const queryKeys = {
  recipes: (userId: string) => ['recipes', userId] as const,
  recipeDetail: (id: string) => ['recipe', id] as const,
  feed: (userId: string) => ['feed', userId] as const,
  discover: (sort: string, tag: string) => ['discover', sort, tag] as const,
}
```
Centralised in `mobile/lib/queries/keys.ts`. Allows targeted invalidation without string literals scattered everywhere.

**D3: Focus-based invalidation via `useFocusEffect`**
Keep `useFocusEffect` but change body from "re-fetch everything" to `queryClient.invalidateQueries({ queryKey: queryKeys.recipes(userId) })`. This marks the query stale, triggering a background refetch while the cached data renders immediately.

**D4: Supabase client in query functions**
Query functions call `supabase` directly (same client already imported on each screen). No wrapper needed — Supabase client is already a singleton.

**D5: Error handling**
`useQuery` returns `{ isError, error }`. Screens show an error message with a retry button when `isError` is true. Replace the current ad-hoc `catch` blocks with this uniform pattern.

## Risks / Trade-offs

[Risk] Query key collisions if two screens use the same key differently → Mitigation: all keys defined in `keys.ts`, reviewed during implementation.

[Risk] `useFocusEffect` + `invalidateQueries` causes unnecessary refetches on every tab switch → Mitigation: with 2-min stale time, invalidation only triggers a network request if data is actually stale. Fresh data serves from cache.

[Risk] Screen-level `interface Recipe` definitions diverge from domain types → Mitigation: query functions in `mobile/lib/queries/` return domain types from `shared/types/domain.ts`; local interfaces are removed.

## Migration Plan

1. Install package, add QueryClientProvider to root layout
2. Create `keys.ts` and query function files
3. Migrate screens one at a time (recipes → home → detail → discover)
4. For each screen: add `useQuery`, remove manual `useEffect`/`useState` data state, keep UI identical
5. Verify each screen individually before moving to next
