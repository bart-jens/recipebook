## MODIFIED Requirements

### Requirement: Recipe list page
The system SHALL display a list of all recipes in the user's collection at `/recipes`, sorted by most recently updated. The collection includes both owned recipes (created_by = user) and saved public recipes (via saved_recipes table). Each list item SHALL show the recipe image (when available), title, description (truncated), prep+cook time if available, and a favorited indicator if the recipe is favorited. The page SHALL include filter options for: All, Favorited, and Want to Cook (never cooked). The page SHALL include an "Import from URL" link alongside the "New recipe" button.

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

### Requirement: Recipe detail page
The system SHALL display the full recipe on a detail page. **When the recipe has an image, it SHALL be shown as a full-width hero at the top of the page.** The owner SHALL see options to edit, publish/unpublish, and delete. **Source attribution SHALL be shown when source_name or source_url is present.** For public recipes, the page SHALL additionally show the creator's display name and avatar (linked to their profile). For the owner's own public recipes, a "Published" badge and "Unpublish" option SHALL be shown. **For imported recipes, a "Share" action SHALL be shown instead of "Publish".** The detail page SHALL show interaction actions: "Cooked It" (always available), "Rate" (enabled after cooking), and "Favorite" (enabled after cooking). For public recipes not owned by the user, a "Save" / "Saved" toggle and a "Fork" action SHALL be shown. For forked recipes, fork attribution SHALL be displayed. The user's cook history for the recipe SHALL be displayed. **An "Add to Collection" action SHALL be available for both owned and saved recipes, showing a picker with the user's collections.**

#### Scenario: Add to collection action
- **WHEN** user views any recipe in their collection (owned or saved)
- **THEN** an "Add to Collection" action SHALL be available

#### Scenario: Collection picker on recipe detail
- **WHEN** user taps "Add to Collection"
- **THEN** a list of the user's collections SHALL be shown with checkboxes
- **AND** collections that already contain this recipe SHALL be pre-checked

#### Scenario: Detail page with image
- **WHEN** a user views a recipe that has an `image_url`
- **THEN** a full-width hero image SHALL be shown at the top

#### Scenario: Owner can add/change image
- **WHEN** the recipe owner views the detail page
- **THEN** an option to add or change the recipe image SHALL be available

#### Scenario: Viewing a public recipe by another creator
- **WHEN** user A views user B's public recipe
- **THEN** the page SHALL display the recipe content
- **AND** SHALL show "By [B's display_name]" with B's avatar, linked to B's profile

#### Scenario: Viewing own public recipe
- **WHEN** user A views their own public recipe
- **THEN** the page SHALL show a "Published" badge
- **AND** an "Unpublish" option SHALL be available

#### Scenario: Viewing a private original recipe
- **WHEN** user A views their own private recipe with source_type = 'manual'
- **THEN** the page SHALL display the recipe content without creator attribution or publish badge
- **AND** a "Publish" option SHALL be available

#### Scenario: Viewing an imported recipe
- **WHEN** user A views their own imported recipe (source_type != 'manual')
- **THEN** the publish action SHALL NOT be shown
- **AND** a share/unshare action SHALL be shown instead

#### Scenario: Aggregate ratings on public recipe
- **GIVEN** a public recipe has ratings from multiple users
- **THEN** the detail page SHALL show the aggregate average rating and total count

#### Scenario: Source attribution with name and URL
- **WHEN** viewing a recipe with source_name = "Serious Eats" and source_url present
- **THEN** the detail page SHALL show "from Serious Eats" as a tappable link to the source URL

#### Scenario: Source attribution with name only
- **WHEN** viewing a recipe with source_name = "The Food Lab" and no source_url
- **THEN** the detail page SHALL show "from The Food Lab" as plain text

#### Scenario: Source attribution with URL only
- **WHEN** viewing a recipe with source_url but no source_name
- **THEN** the detail page SHALL show "from [domain]" as a tappable link

#### Scenario: No source attribution for manual recipes
- **WHEN** viewing a recipe with source_type = 'manual'
- **THEN** no source attribution SHALL be displayed

### Requirement: Source name input for photo/book imports
When importing a recipe from a photo (source_type = 'photo'), the system SHALL prompt the user to enter the source name (e.g. cookbook title). The prompt SHALL appear on the import review screen before saving. The input SHALL be optional but encouraged with placeholder text like "e.g. The Food Lab, Ottolenghi Simple". The user SHALL also have the option to photograph the book cover for automatic title extraction via Gemini Vision.

#### Scenario: User enters source name manually
- **WHEN** user imports a recipe from a cookbook photo and types "Ottolenghi Simple" as the source
- **THEN** the recipe SHALL be saved with `source_name` = "Ottolenghi Simple"

#### Scenario: User skips source name
- **WHEN** user imports a recipe from a photo and leaves the source name empty
- **THEN** the recipe SHALL be saved with `source_name` = null

#### Scenario: User photographs book cover
- **WHEN** user taps "Scan book cover" and photographs the cover of "Salt Fat Acid Heat"
- **THEN** the system SHALL extract the book title via Gemini Vision and pre-fill the source name field with "Salt Fat Acid Heat"

## REMOVED Requirements

### Requirement: Favorites toggle on recipe list
**Reason**: Replaced by the new recipe interaction model. `is_favorite` column on recipes is replaced by `recipe_favorites` table with cooking gate. The old favorites filter is replaced by "Favorited" and "Want to Cook" filters.
**Migration**: `is_favorite` column dropped. New `recipe_favorites` table handles the favorited concept with cooking gate (must cook before favoriting).
