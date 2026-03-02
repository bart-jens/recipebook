## Why

Users can search their recipes by title, but not by ingredient. "I have chicken and lemons — what can I make?" is a common cooking scenario that the app cannot answer today. Full-text search on `recipe_ingredients.ingredient_name` solves this with no AI required. High user value, low engineering effort. Extends naturally to the public Discover page.

## What Changes

- Add a PostgreSQL full-text search index on `recipe_ingredients.ingredient_name`
- Add a DB function `search_recipes_by_ingredient(query text, user_id uuid)` that returns recipe IDs matching the ingredient search for the authenticated user's collection
- Extend the existing recipe search UI on both web and mobile to include ingredient search results
- On Discover, add ingredient search to the public recipe search (searches ingredients of public recipes)
- Search is additive: results that match title OR ingredient are returned together (no separate UI mode)

## Capabilities

### New Capabilities
- `ingredient-search`: Full-text search on recipe ingredients, integrated into existing recipe search on web and mobile

### Modified Capabilities
- `recipe-crud`: Recipe list page search behavior now includes ingredient matches

## Impact

- **New migration**: add GIN index on `recipe_ingredients.ingredient_name`, create `search_recipes_by_ingredient` RPC
- **Web**: `src/app/(authenticated)/recipes/page.tsx` — existing search query extended to OR-join ingredient matches
- **Mobile**: `mobile/app/(tabs)/recipes.tsx` — existing search extended similarly
- **Web Discover**: `src/app/(authenticated)/discover/page.tsx` — ingredient search on public recipes
- **Mobile Discover**: `mobile/app/(tabs)/discover.tsx` — same
- **RLS**: RPC must use `SECURITY DEFINER` and scope to `auth.uid()` — auditor required before merging migration
