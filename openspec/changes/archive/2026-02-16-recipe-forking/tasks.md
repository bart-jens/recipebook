## 1. Database: Source Type & Constraints

- [x] 1.1 Create migration: Add 'fork' to the `source_type` CHECK constraint on recipes table. Update the import-only publishing constraint to also allow source_type = 'fork' to be published.

## 2. Backend: Fork API

- [x] 2.1 Create API route `/api/recipes/[id]/fork` (POST). Validates recipe is public, copies recipe row (title, description, instructions, times, servings, image_url) with forked_from_id set, source_type = 'fork', visibility = 'private', created_by = auth user. Copies all ingredients and tags. Inserts recipe_analytics event (type = 'fork'). Returns the new recipe ID. All in a transaction.

## 3. Web: Fork UI

- [x] 3.1 Add "Fork" button on public recipe detail page (not shown for own recipes). On click: call fork API, navigate to the new forked recipe on success, show error on failure.
- [x] 3.2 Add fork attribution display on recipe detail page. When recipe has forked_from_id: show "Forked from [title] by [creator]" with links. When forked_from_id is NULL but source_type = 'fork': show "Forked from a recipe that is no longer available."
- [x] 3.3 Add fork count to recipe cards on discover page. Query count of recipes where forked_from_id = recipe.id. Display as fork icon + count.

## 4. Mobile: Fork UI

- [x] 4.1 Add "Fork" button on mobile public recipe detail screen. On tap: call fork API, haptic feedback, navigate to forked recipe.
- [x] 4.2 Add fork attribution display on mobile recipe detail. Same logic as web.
- [x] 4.3 Add fork count to recipe cards on mobile discover tab.

## 5. Verification

- [x] 5.1 Verify fork creates complete copy (recipe + all ingredients + all tags) with correct forked_from_id and source_type = 'fork'.
- [x] 5.2 Verify fork attribution shows correctly, including when original is deleted (forked_from_id = NULL).
- [x] 5.3 Verify forked recipe with source_type = 'fork' can be published (not blocked by import restriction).
