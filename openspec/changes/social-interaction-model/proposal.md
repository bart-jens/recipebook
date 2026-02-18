## Why

The current recipe interactions are flat — ratings and favorites exist but aren't gated by actual cooking. This means ratings can come from people who never made the dish, and "favorites" is just a bookmark. The social interaction model introduces meaningful gates: you must cook a recipe before rating or favoriting it. "Cooked It" becomes the primary social signal, and the unified collection (own + saved) gives users a single view of their recipes. This is the foundation the activity feed needs to work.

## What Changes

- **New `cook_log` table** — Log each time a user cooks a recipe, with optional notes. Multiple cooks per recipe allowed.
- **New `saved_recipes` table** — Bookmark other users' public recipes into your collection. Replaces ad-hoc "save" behavior.
- **New `recipe_favorites` table** — Distinct from saved. "This is a go-to recipe." Gated: must have cooked the recipe at least once.
- **Rating gate** — RLS policy on `recipe_ratings` insert requires at least one `cook_log` entry. Every rating = someone who actually cooked it.
- **Unified collection view** — Recipe list shows owned recipes + saved public recipes as one list. Filters (search, tags, favorited, want-to-cook) apply across both.
- **Recipe detail actions** — "Cooked It" button (always available), "Save/Saved" toggle (for public recipes from others), "Favorite" (gated on cook), "Rate" (gated on cook). Cook history displayed on detail page.
- **Migration** — Drop `is_favorite` column from recipes. Backfill `cook_log` from existing `recipe_ratings` rows with `cooked_date`.
- **Both web and mobile** — All UI changes implemented on both platforms.

## Capabilities

### New Capabilities

_(None — all capabilities are already specced)_

### Modified Capabilities

- `recipe-interactions`: Implementing the full interaction model (cook_log, saved_recipes, recipe_favorites, cooking gates, unified collection, detail page actions, migration from is_favorite)
- `recipe-crud`: Recipe list must become unified collection view (own + saved recipes). Filters must work across both.

## Impact

**Database:** 3 new tables (cook_log, saved_recipes, recipe_favorites), RLS policies with cook-gate checks, migration to drop is_favorite and backfill cook_log
**Web:** Recipe detail page (action buttons), recipe list page (unified collection), home dashboard (stats update)
**Mobile:** Recipe detail screen (action buttons with haptic), recipe list screen (unified collection), home tab (stats update)
**API:** New Supabase queries for cook_log CRUD, save/unsave, favorite/unfavorite
