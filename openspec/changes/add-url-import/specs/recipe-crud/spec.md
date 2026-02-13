## MODIFIED Requirements

### Requirement: Recipe list page
The system SHALL display a list of all recipes owned by the authenticated user at `/recipes`, sorted by most recently updated. Each list item SHALL show the recipe title, description (truncated), and prep+cook time if available. The page SHALL include an "Import from URL" link alongside the "New recipe" button.

#### Scenario: User with recipes
- **WHEN** an authenticated user navigates to `/recipes`
- **THEN** all their recipes SHALL be displayed sorted by `updated_at` descending

#### Scenario: User with no recipes
- **WHEN** an authenticated user with no recipes navigates to `/recipes`
- **THEN** an empty state message SHALL be shown with links to create a new recipe or import from URL

#### Scenario: List item display
- **WHEN** a recipe has title "Pasta Carbonara", description "Classic Italian pasta", and cook time 20 minutes
- **THEN** the list item SHALL show the title, a truncated description, and "20 min cook"

#### Scenario: Import from URL entry point
- **WHEN** a user is on the recipes list page
- **THEN** an "Import from URL" link SHALL be visible that navigates to `/recipes/import-url`
