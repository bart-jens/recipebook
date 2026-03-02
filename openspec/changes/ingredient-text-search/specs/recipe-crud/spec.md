## MODIFIED Requirements

### Requirement: Recipe list page
The system SHALL display a list of all recipes in the user's collection at `/recipes`, sorted by most recently updated. The collection includes both owned recipes (created_by = user) and saved public recipes (via saved_recipes table). Each list item SHALL show the recipe image (when available), title, description (truncated), prep+cook time if available, and a favorited indicator if the recipe is favorited. The page SHALL include filter options for: All, Favorited, and Want to Cook (never cooked). The page SHALL include an "Import from URL" link alongside the "New recipe" button. **When a search query is present, results SHALL include recipes whose title OR ingredient names match the query.**

#### Scenario: User with recipes
- **WHEN** an authenticated user navigates to `/recipes`
- **THEN** all their owned recipes and saved recipes SHALL be displayed sorted by `updated_at` descending

#### Scenario: User with no recipes
- **WHEN** an authenticated user with no recipes navigates to `/recipes`
- **THEN** an empty state message SHALL be shown with links to create a new recipe or import from URL

#### Scenario: List item display
- **WHEN** a recipe has title "Pasta Carbonara", description "Classic Italian pasta", and cook time 20 minutes
- **THEN** the list item SHALL show the title, a truncated description, and "20 min cook"

#### Scenario: Import from URL entry point
- **WHEN** a user is on the recipes list page
- **THEN** an "Import from URL" link SHALL be visible that navigates to `/recipes/import-url`

#### Scenario: List item with image
- **WHEN** a recipe has an `image_url` and appears in the user's recipe list
- **THEN** the list item SHALL show the image as a card hero (mobile) or thumbnail (web)

#### Scenario: List item without image
- **WHEN** a recipe has no `image_url`
- **THEN** the list item SHALL show a placeholder icon instead of a broken image

#### Scenario: Favorited indicator on list item
- **WHEN** a recipe is favorited by the user (has a recipe_favorites entry)
- **THEN** the list item SHALL show a distinct favorited indicator

#### Scenario: Filter by Favorited
- **WHEN** user selects the "Favorited" filter
- **THEN** only recipes with a recipe_favorites entry for this user SHALL be shown

#### Scenario: Filter by Want to Cook
- **WHEN** user selects the "Want to Cook" filter
- **THEN** only recipes with zero cook_log entries for this user SHALL be shown

#### Scenario: Saved recipe in list
- **WHEN** user A has saved user B's public recipe
- **THEN** user B's recipe SHALL appear in user A's recipe list alongside their own recipes

#### Scenario: Search by ingredient name
- **WHEN** a user types an ingredient name in the search box
- **THEN** the results SHALL include recipes that contain that ingredient, even if the title does not match
