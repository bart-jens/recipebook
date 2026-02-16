## Why

The current recipe interaction model overloads `is_favorite` to mean both "I want to cook this" and "I love this recipe." Ratings exist but don't enforce that the user actually cooked the dish. As EefEats evolves into a social platform, these interactions become the core signals — what shows up in feeds, what builds trust in ratings, what makes the platform feel alive. We need to split these into five distinct, gated actions before building the activity feed and social features on top.

## What Changes

- **Replace `is_favorite` with explicit "Saved" concept** — A user's collection is their saved recipes: originals they created, imports, and public recipes they bookmark. Migrate all existing `is_favorite = true` recipes to saved status.
- **Elevate "Cooked It" as a first-class action** — Cooking log entries (currently `recipe_ratings.cooked_date`) become prominent and independent from rating. Users can log a cook without rating. This is the primary social signal.
- **Add "Favorited" as a separate badge** — "This is a go-to recipe." Gate: must have cooked at least once. Distinct from saved.
- **Enforce cooking gates on rating** — Users cannot rate a recipe they haven't logged as cooked. Every rating on EefEats means someone actually made the dish.
- **Update UI on both web and mobile** — Recipe detail, recipe list, and discover pages reflect the new interaction model with clear affordances for each action.

## Capabilities

### New Capabilities
- `recipe-interactions`: The five-action interaction model (saved, cooked-it, rating, favorited) with gates, database schema, and UI across web and mobile.

### Modified Capabilities
- `recipe-crud`: Recipe list and detail pages update to show saved/favorited/cooked status instead of `is_favorite`. Detail page gets "Cooked It" and "Favorite" actions.
- `social-platform`: Activity feed requirements reference new cooking log signals. Rating requirements updated with cooking gate.

## Impact

- **Database**: New `cook_log` table, new `saved_recipes` table for bookmarking public recipes, new `is_favorited` boolean on recipes. Migration to move `is_favorite` data. Drop `is_favorite` column after migration.
- **Web app**: Recipe detail page, recipe list page, discover page — updated interactions and UI.
- **Mobile app**: Recipe detail, recipe list, discover tab — updated interactions and UI.
- **API**: Rating endpoints enforce cooking gate. New endpoints for cook log and save/unsave.
- **Existing data**: All current `is_favorite = true` recipes migrate to saved status. No data loss.
