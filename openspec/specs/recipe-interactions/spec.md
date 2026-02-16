## ADDED Requirements

### Requirement: Cook log table
The database SHALL have a `cook_log` table with columns: `id` (uuid PK, default gen_random_uuid()), `user_id` (uuid, NOT NULL, FK to auth.users on delete cascade), `recipe_id` (uuid, NOT NULL, FK to recipes on delete cascade), `cooked_at` (timestamptz, NOT NULL, default now()), `notes` (text, nullable), `created_at` (timestamptz, NOT NULL, default now()). There SHALL be an index on (user_id, recipe_id) for gate checks. Multiple cook entries for the same user+recipe SHALL be allowed (a user can cook the same recipe many times).

#### Scenario: Logging a cook event
- **WHEN** user A logs that they cooked recipe X on 2026-02-15
- **THEN** a row SHALL be inserted into cook_log with user_id = A, recipe_id = X, cooked_at = 2026-02-15

#### Scenario: Cooking the same recipe multiple times
- **WHEN** user A logs cooking recipe X a second time on 2026-02-20
- **THEN** a second row SHALL be inserted into cook_log
- **AND** both entries SHALL be preserved (no unique constraint on user_id + recipe_id)

#### Scenario: Cook log with notes
- **WHEN** user A logs cooking recipe X with notes "Doubled the garlic, used fresh basil"
- **THEN** the cook_log row SHALL include the notes text

#### Scenario: Cook log without notes
- **WHEN** user A logs cooking recipe X without adding notes
- **THEN** the cook_log row SHALL have notes = null

#### Scenario: Deleting a recipe removes cook logs
- **WHEN** recipe X is deleted
- **THEN** all cook_log entries for recipe X SHALL be cascade deleted

### Requirement: Cook log RLS
RLS SHALL be enabled on the cook_log table. Authenticated users SHALL be able to insert cook entries for recipes they own or recipes that are public. Users SHALL be able to view their own cook log entries. Users SHALL be able to delete their own cook log entries. Cook log entries for public recipes SHALL be visible to all authenticated users (for future activity feed).

#### Scenario: User logs cook on own recipe
- **WHEN** user A inserts a cook_log entry for their own private recipe
- **THEN** the insert SHALL succeed

#### Scenario: User logs cook on public recipe
- **WHEN** user A inserts a cook_log entry for user B's public recipe
- **THEN** the insert SHALL succeed

#### Scenario: User cannot log cook on someone else's private recipe
- **WHEN** user A tries to insert a cook_log entry for user B's private recipe
- **THEN** the insert SHALL be rejected by RLS

#### Scenario: User views own cook log
- **WHEN** user A queries cook_log for their own entries
- **THEN** all of user A's cook_log entries SHALL be returned

#### Scenario: User views cook activity on public recipes
- **WHEN** user A queries cook_log entries for a public recipe
- **THEN** all cook_log entries for that public recipe SHALL be returned

### Requirement: Saved recipes table
The database SHALL have a `saved_recipes` table with columns: `id` (uuid PK, default gen_random_uuid()), `user_id` (uuid, NOT NULL, FK to auth.users on delete cascade), `recipe_id` (uuid, NOT NULL, FK to recipes on delete cascade), `created_at` (timestamptz, NOT NULL, default now()). There SHALL be a unique constraint on (user_id, recipe_id). This table is for bookmarking OTHER users' public recipes into your collection. A user's own recipes are implicitly saved by ownership.

#### Scenario: Saving a public recipe
- **WHEN** user A saves user B's public recipe X
- **THEN** a row SHALL be inserted into saved_recipes with user_id = A, recipe_id = X

#### Scenario: Cannot save own recipe
- **WHEN** user A attempts to save their own recipe
- **THEN** the application SHALL prevent this (own recipes are implicitly in the collection)

#### Scenario: Cannot save the same recipe twice
- **WHEN** user A saves recipe X a second time
- **THEN** the insert SHALL be rejected by the unique constraint

#### Scenario: Unsaving a recipe
- **WHEN** user A unsaves recipe X
- **THEN** the saved_recipes row SHALL be deleted
- **AND** any associated cook_log and recipe_favorites entries by user A for recipe X SHALL remain (unsaving doesn't erase history)

#### Scenario: Original recipe deleted or unpublished
- **WHEN** a saved recipe is deleted by its owner
- **THEN** the saved_recipes row SHALL be cascade deleted

### Requirement: Saved recipes RLS
RLS SHALL be enabled on saved_recipes. Users SHALL be able to save public recipes (insert with user_id = auth.uid() and recipe must be public). Users SHALL be able to view their own saved recipes. Users SHALL be able to unsave (delete their own entries).

#### Scenario: Saving a public recipe succeeds
- **WHEN** user A inserts into saved_recipes for a public recipe
- **THEN** the insert SHALL succeed

#### Scenario: Saving a private recipe fails
- **WHEN** user A inserts into saved_recipes for user B's private recipe
- **THEN** the insert SHALL be rejected by RLS

#### Scenario: Cannot view other users' saves
- **WHEN** user A queries saved_recipes
- **THEN** only user A's own saved_recipes rows SHALL be returned

### Requirement: Recipe favorites table
The database SHALL have a `recipe_favorites` table with columns: `id` (uuid PK, default gen_random_uuid()), `user_id` (uuid, NOT NULL, FK to auth.users on delete cascade), `recipe_id` (uuid, NOT NULL, FK to recipes on delete cascade), `created_at` (timestamptz, NOT NULL, default now()). There SHALL be a unique constraint on (user_id, recipe_id).

#### Scenario: Favoriting a recipe
- **WHEN** user A favorites recipe X (which they have cooked at least once)
- **THEN** a row SHALL be inserted into recipe_favorites with user_id = A, recipe_id = X

#### Scenario: Cannot favorite the same recipe twice
- **WHEN** user A favorites recipe X a second time
- **THEN** the insert SHALL be rejected by the unique constraint

#### Scenario: Unfavoriting a recipe
- **WHEN** user A unfavorites recipe X
- **THEN** the recipe_favorites row SHALL be deleted

### Requirement: Favorite cooking gate
A user SHALL NOT be able to favorite a recipe they have not cooked at least once. The gate SHALL be enforced at the database level via an RLS policy that checks for at least one cook_log entry for the user+recipe pair.

#### Scenario: Favoriting after cooking
- **GIVEN** user A has at least one cook_log entry for recipe X
- **WHEN** user A favorites recipe X
- **THEN** the insert SHALL succeed

#### Scenario: Favoriting without cooking
- **GIVEN** user A has no cook_log entries for recipe X
- **WHEN** user A attempts to favorite recipe X
- **THEN** the insert SHALL be rejected

#### Scenario: Unfavoriting does not affect cook log
- **WHEN** user A unfavorites recipe X
- **THEN** user A's cook_log entries for recipe X SHALL remain

### Requirement: Rating cooking gate
A user SHALL NOT be able to rate a recipe they have not cooked at least once. The RLS insert policy on `recipe_ratings` SHALL check for at least one cook_log entry for the user+recipe pair before allowing a rating insert.

#### Scenario: Rating after cooking
- **GIVEN** user A has at least one cook_log entry for recipe X
- **WHEN** user A submits a 4-star rating for recipe X
- **THEN** the rating SHALL be inserted

#### Scenario: Rating without cooking
- **GIVEN** user A has no cook_log entries for recipe X
- **WHEN** user A attempts to rate recipe X
- **THEN** the insert SHALL be rejected by the RLS policy

#### Scenario: Existing ratings remain valid
- **GIVEN** user A rated recipe X before the cook_log system existed
- **AND** the migration backfilled a cook_log entry from the rating's cooked_date
- **THEN** user A's existing rating SHALL remain valid

### Requirement: Unified collection view
The user's recipe collection SHALL be the union of: (1) recipes owned by the user (created_by = user), and (2) public recipes saved by the user (via saved_recipes). The collection view SHALL display these as a single list without distinguishing between owned and saved recipes, except for an optional indicator showing the recipe source.

#### Scenario: Collection shows own recipes
- **WHEN** user A views their recipe collection
- **THEN** all recipes with created_by = A SHALL appear

#### Scenario: Collection shows saved recipes
- **WHEN** user A has saved 3 public recipes from other users
- **THEN** those 3 recipes SHALL also appear in user A's collection

#### Scenario: Collection filters apply to both
- **WHEN** user A searches for "pasta" in their collection
- **THEN** the search SHALL match across both owned and saved recipes

#### Scenario: Favorited filter
- **WHEN** user A filters their collection by "Favorited"
- **THEN** only recipes that user A has favorited SHALL be shown (from both owned and saved)

#### Scenario: Want to cook filter
- **WHEN** user A filters their collection by "Want to Cook"
- **THEN** only recipes that user A has NOT cooked (zero cook_log entries) SHALL be shown

### Requirement: Cook log UI on recipe detail
The recipe detail page SHALL show a "Cooked It" action. Tapping it SHALL log a cook event with the current date. An optional notes field SHALL be available. After logging a cook, the rating and favorite actions SHALL become available. The detail page SHALL show the user's cook history for that recipe (list of dates cooked with notes).

#### Scenario: First cook action on web
- **WHEN** user views a recipe they haven't cooked and taps "Cooked It"
- **THEN** a cook_log entry SHALL be created with today's date
- **AND** the rate and favorite actions SHALL become enabled

#### Scenario: First cook action on mobile
- **WHEN** user views a recipe they haven't cooked and taps "Cooked It" on mobile
- **THEN** a cook_log entry SHALL be created with today's date
- **AND** haptic feedback SHALL be triggered
- **AND** the rate and favorite actions SHALL become enabled

#### Scenario: Cook history display
- **GIVEN** user has cooked recipe X three times
- **WHEN** user views recipe X's detail page
- **THEN** the cook history SHALL show all three dates with any associated notes

#### Scenario: Adding notes to a cook
- **WHEN** user taps "Cooked It" and adds notes "Used half the sugar"
- **THEN** the cook_log entry SHALL include the notes

### Requirement: Save action on public recipe detail
The recipe detail page for a public recipe (not owned by the user) SHALL show a "Save" action. Tapping it SHALL add the recipe to the user's collection via saved_recipes. If already saved, the action SHALL show "Saved" and tapping SHALL unsave.

#### Scenario: Saving a public recipe from detail page
- **WHEN** user A views user B's public recipe and taps "Save"
- **THEN** the recipe SHALL be added to user A's saved_recipes
- **AND** the button SHALL change to "Saved"

#### Scenario: Unsaving from detail page
- **WHEN** user A views a recipe they have saved and taps "Saved"
- **THEN** the saved_recipes entry SHALL be deleted
- **AND** the button SHALL change back to "Save"

#### Scenario: Save action not shown for own recipes
- **WHEN** user A views their own recipe
- **THEN** the "Save" action SHALL NOT be shown (own recipes are implicitly in collection)

### Requirement: Favorite action on recipe detail
The recipe detail page SHALL show a "Favorite" action. The action SHALL only be enabled if the user has cooked the recipe at least once. Tapping it SHALL toggle the favorite status. Favorited recipes SHALL show a distinct visual indicator.

#### Scenario: Favorite enabled after cooking
- **GIVEN** user A has cooked recipe X at least once
- **WHEN** user A views recipe X
- **THEN** the favorite action SHALL be enabled

#### Scenario: Favorite disabled before cooking
- **GIVEN** user A has NOT cooked recipe X
- **WHEN** user A views recipe X
- **THEN** the favorite action SHALL be disabled or hidden
- **AND** if visible, a tooltip or label SHALL explain "Cook this recipe first to favorite it"

#### Scenario: Toggling favorite on
- **WHEN** user A taps the favorite action on a non-favorited recipe
- **THEN** a recipe_favorites entry SHALL be created
- **AND** the visual indicator SHALL update to show favorited state

#### Scenario: Toggling favorite off
- **WHEN** user A taps the favorite action on a favorited recipe
- **THEN** the recipe_favorites entry SHALL be deleted
- **AND** the visual indicator SHALL update to show non-favorited state

### Requirement: Migration from is_favorite
The migration SHALL drop the `is_favorite` column from the `recipes` table. Existing `recipe_ratings` rows with `cooked_date IS NOT NULL` SHALL be backfilled into `cook_log`.

#### Scenario: is_favorite column dropped
- **WHEN** the migration runs
- **THEN** the `is_favorite` column SHALL be removed from the `recipes` table

#### Scenario: Cook log backfill from ratings
- **GIVEN** a recipe_ratings row exists with user_id = A, recipe_id = X, cooked_date = 2026-01-15
- **WHEN** the migration runs
- **THEN** a cook_log entry SHALL be created with user_id = A, recipe_id = X, cooked_at = 2026-01-15

#### Scenario: Ratings without cooked_date skipped
- **GIVEN** a recipe_ratings row exists with cooked_date = NULL
- **WHEN** the migration runs
- **THEN** no cook_log entry SHALL be created for that rating
