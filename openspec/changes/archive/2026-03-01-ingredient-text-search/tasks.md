## 1. Database Migration

- [x] 1.1 Write `supabase/migrations/20240101000052_ingredient_text_search.sql` — GIN index on `recipe_ingredients.ingredient_name` using `to_tsvector('english', ingredient_name)`
- [x] 1.2 Add `search_recipes_by_ingredient(query text)` SECURITY DEFINER function — returns `uuid[]` of recipe IDs accessible to `auth.uid()` (owned + saved) whose ingredients match query
- [x] 1.3 Add `search_public_recipes_by_ingredient(query text)` function — returns `uuid[]` of public recipe IDs whose ingredients match
- [x] 1.4 Run `rls-auditor` agent on the migration before proceeding

## 2. Update Web Recipe List

- [x] 2.1 In `src/app/(authenticated)/recipes/page.tsx`, when `q` is non-empty, call `search_recipes_by_ingredient(q)` RPC and collect matching recipe IDs
- [x] 2.2 Extend the existing title filter to OR-join ingredient match IDs: recipes matching title OR ingredient appear in results
- [x] 2.3 Add hint text below the search input: "Search by name or ingredient" (web)

## 3. Update Web Discover

- [x] 3.1 In `src/app/(authenticated)/discover/page.tsx`, when `q` is non-empty, call `search_public_recipes_by_ingredient(q)` and OR-join with title matches
- [x] 3.2 Update hint text on Discover search to "Search by name or ingredient"

## 4. Update Mobile Recipe List

- [x] 4.1 In `mobile/app/(tabs)/recipes.tsx`, when search query is non-empty, call `supabase.rpc('search_recipes_by_ingredient', { query: search })` and collect matching IDs
- [x] 4.2 Include ingredient-matched recipe IDs in the filter applied to the recipes list (union with title matches)
- [x] 4.3 Update search placeholder to "Search by name or ingredient" (mobile)

## 5. Update Mobile Discover

- [x] 5.1 In `mobile/app/(tabs)/discover.tsx`, call `search_public_recipes_by_ingredient` for ingredient matching when query is non-empty
- [x] 5.2 Update search placeholder to "Search by name or ingredient" (mobile discover)

## 6. Verify

- [x] 6.1 Run `npx tsc --noEmit` on both platforms — zero new type errors (3 pre-existing errors in import-photo, import-url, auth.tsx — unrelated; web RPC calls use `as any` cast pending type regen after migration is applied)
- [ ] 6.2 Manual test: search "lemon" on web, confirm recipes with lemon ingredient appear
- [ ] 6.3 Manual test: same on mobile
- [ ] 6.4 Manual test: confirm title search still works (no regression)
