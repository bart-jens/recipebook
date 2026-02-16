## 1. Database: New Tables & Migration

- [x] 1.1 Create migration: `cook_log` table with id, user_id, recipe_id, cooked_at, notes, created_at. Index on (user_id, recipe_id). RLS enabled with policies: insert for own/public recipes, select own + public recipe logs, delete own entries.
- [x] 1.2 Create migration: `saved_recipes` table with id, user_id, recipe_id, created_at. Unique (user_id, recipe_id). RLS enabled with policies: insert for public recipes only (user_id = auth.uid()), select own entries, delete own entries.
- [x] 1.3 Create migration: `recipe_favorites` table with id, user_id, recipe_id, created_at. Unique (user_id, recipe_id). RLS enabled with policies: insert requires cook_log entry exists for user+recipe, select own entries, delete own entries.
- [x] 1.4 Create migration: Update `recipe_ratings` RLS insert policy to require at least one cook_log entry for the user+recipe pair before allowing rating insert.
- [x] 1.5 Create migration: Backfill `cook_log` from existing `recipe_ratings` rows where cooked_date IS NOT NULL. Then drop `is_favorite` column from `recipes` table.

## 2. Web: Recipe Detail Interactions

- [x] 2.1 Add "Cooked It" button to recipe detail page. On click: insert cook_log entry with current date, optional notes modal. Show cook history (dates + notes) on the detail page.
- [x] 2.2 Add "Rate" action to recipe detail page, gated: only enabled when user has at least one cook_log entry. Existing rating UI stays, but disable/hide if not cooked.
- [x] 2.3 Add "Favorite" toggle to recipe detail page, gated: only enabled when user has at least one cook_log entry. Toggle inserts/deletes recipe_favorites row. Show distinct visual indicator.
- [x] 2.4 Add "Save" / "Saved" toggle on public recipe detail pages (for recipes not owned by current user). Toggle inserts/deletes saved_recipes row.

## 3. Web: Recipe List Updates

- [x] 3.1 Update recipe list query to include saved recipes (UNION of owned + saved_recipes). Show favorited indicator on list items.
- [x] 3.2 Replace old favorites filter with new filters: "Favorited" (has recipe_favorites entry) and "Want to Cook" (zero cook_log entries). Remove references to `is_favorite`.
- [x] 3.3 Remove all `is_favorite` references from web codebase (toggle, filter, sort, types).

## 4. Mobile: Recipe Detail Interactions

- [x] 4.1 Add "Cooked It" button to mobile recipe detail screen. On tap: insert cook_log entry, haptic feedback, optional notes input. Show cook history section.
- [x] 4.2 Add "Rate" action to mobile recipe detail, gated by cook_log existence. Existing rating UI stays, gated.
- [x] 4.3 Add "Favorite" toggle to mobile recipe detail, gated by cook_log existence. Haptic feedback on toggle.
- [x] 4.4 Add "Save" / "Saved" toggle on public recipe detail screens (for recipes not owned by current user).

## 5. Mobile: Recipe List Updates

- [x] 5.1 Update mobile recipe list query to include saved recipes. Show favorited indicator on list items.
- [x] 5.2 Replace old favorites filter with "Favorited" and "Want to Cook" filters. Remove references to `is_favorite`.
- [x] 5.3 Remove all `is_favorite` references from mobile codebase.

## 6. Verification

- [x] 6.1 Verify cooking gate: confirm ratings and favorites are rejected by DB when no cook_log entry exists.
- [x] 6.2 Verify migration: confirm cook_log backfill from existing ratings, confirm is_favorite column dropped.
- [x] 6.3 Verify unified collection: confirm saved public recipes appear in user's recipe list alongside owned recipes on both web and mobile.
