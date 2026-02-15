## MODIFIED Requirements

### Requirement: Recipe list page
The system SHALL display a list of all recipes owned by the authenticated user. Each list item SHALL show the recipe **image** (when available), title, description (truncated), and prep+cook time if available. The page SHALL include an "Import from URL" link alongside the "New recipe" button.

#### Scenario: List item with image
- **WHEN** a recipe has an `image_url` and appears in the user's recipe list
- **THEN** the list item SHALL show the image as a card hero (mobile) or thumbnail (web)

#### Scenario: List item without image
- **WHEN** a recipe has no `image_url`
- **THEN** the list item SHALL show a placeholder icon instead of a broken image

### Requirement: Recipe detail page
The system SHALL display the full recipe on a detail page. **When the recipe has an image, it SHALL be shown as a full-width hero at the top of the page.** The owner SHALL see options to edit, publish/unpublish, and delete.

#### Scenario: Detail page with image
- **WHEN** a user views a recipe that has an `image_url`
- **THEN** a full-width hero image SHALL be shown at the top

#### Scenario: Owner can add/change image
- **WHEN** the recipe owner views the detail page
- **THEN** an option to add or change the recipe image SHALL be available
