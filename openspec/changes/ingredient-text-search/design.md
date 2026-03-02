## Context

Current search: web uses Supabase `.ilike('title', '%q%')` on the recipes query. Mobile uses client-side filter on a pre-fetched recipe array. Neither touches `recipe_ingredients`. No FTS index exists on any table.

## Goals / Non-Goals

**Goals:**
- Ingredient search for the user's own recipe collection (web + mobile)
- Ingredient search on Discover page (public recipes)
- Results blend title and ingredient matches (no separate toggle)
- Correct RLS: users can only find recipes they own or have saved

**Non-Goals:**
- Semantic / AI ingredient matching ("chicken" matching "poultry")
- Ingredient search on other people's private recipes
- Ingredient autocomplete / suggestions
- Changing the search input UI beyond adding a subtitle hint

## Decisions

**D1: GIN index on `recipe_ingredients.ingredient_name`**
PostgreSQL full-text search with `to_tsvector('english', ingredient_name)` and a GIN index. Fast for the collection sizes expected (hundreds to low thousands per user).

**D2: Server-side RPC instead of client-side ingredient filter**
A DB function `search_recipes_by_ingredient(query text)` returns recipe IDs the authenticated user can access AND whose ingredients match. This keeps RLS correct — the function uses `auth.uid()` internally, is `SECURITY DEFINER`, and the calling user only sees their own + saved recipes.

**D3: OR-join with title search**
The existing title search uses `.ilike`. The ingredient search returns a set of recipe IDs. The final query is: `WHERE title ILIKE '%q%' OR id = ANY(ingredient_match_ids)`. Single unified result set.

**D4: Mobile: move to server-side search**
Mobile currently does client-side filtering on a pre-fetched array. With ingredient search, a server-side call is required (can't filter ingredients client-side without fetching all ingredients). After TanStack Query is in place, this query will be refetched with search params.

**D5: Discover page ingredient search scoped to public recipes**
A separate variant `search_public_recipes_by_ingredient(query text)` returns IDs of public recipes whose ingredients match. No `auth.uid()` scoping needed — public data.

## Risks / Trade-offs

[Risk] RPC with `SECURITY DEFINER` can bypass RLS if implemented incorrectly → Mitigation: rls-auditor required before merge; function must explicitly join against user's accessible recipe set.

[Risk] Client-side ingredient filter removal breaks mobile offline use → Mitigation: offline caching (separate Sprint 2 change) will cache the full recipe list; search against cached data is a future optimization.

[Risk] Performance on large collections — GIN index alleviates this, but collections >10k recipes may still be slow → Mitigation: not a current concern given invite-only phase.

## Migration Plan

1. Write migration: GIN index + `search_recipes_by_ingredient` + `search_public_recipes_by_ingredient` RPCs
2. Run rls-auditor on migration before merging
3. Update web recipes page to OR-join ingredient results
4. Update web discover page
5. Update mobile recipes screen
6. Update mobile discover screen
