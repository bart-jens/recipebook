## 1. Create Shared Type File

- [x] 1.1 Create `shared/types/domain.ts` with `RecipeListItem`, `PublicRecipe`, `UserProfile`, `FeedItem` types (with JSDoc comments pointing to source DB tables)

## 2. Update Web Files

- [x] 2.1 Update `src/app/(authenticated)/recipes/page.tsx` — import `RecipeListItem`, remove local type definitions, remove `as unknown as` cast
- [x] 2.2 Update `src/app/(authenticated)/discover/page.tsx` — import `PublicRecipe`, remove local `PublicRecipe`/`EnrichedRecipe` interfaces, remove `as unknown as` cast
- [x] 2.3 Update `src/app/(authenticated)/discover/chefs-tab.tsx` — import `ChefListItem`, remove local type definitions
- [x] 2.4 Update `src/app/(authenticated)/profile/[id]/page.tsx` — skipped: `ChefProfileData` is an RPC-specific page aggregate, not a shareable domain type; no duplication exists to remove

## 3. Update Mobile Files

- [x] 3.1 Update `mobile/app/(tabs)/recipes.tsx` — import `RecipeListItem`, remove local type definitions
- [x] 3.2 Update `mobile/app/(tabs)/index.tsx` — import `FeedItem`, remove local type definitions

## 4. Verify

- [x] 4.1 Run `npx tsc --noEmit` in `src/` (web) — zero type errors (only pre-existing import-status errors unrelated to this change)
- [x] 4.2 Run `npx tsc --noEmit` in `mobile/` — zero type errors (only pre-existing cardBg token errors unrelated to this change)
