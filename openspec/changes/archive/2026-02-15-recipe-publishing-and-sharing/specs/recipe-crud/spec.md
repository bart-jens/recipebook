## MODIFIED Requirements

### Requirement: Recipe detail view
The recipe detail page SHALL display the full recipe: title, description, ingredients, instructions, time/servings, tags, images, and ratings. **Source attribution SHALL be shown when source_name or source_url is present.** For public recipes, the page SHALL additionally show the creator's display name and avatar (linked to their profile). For the owner's own public recipes, a "Published" badge and "Unpublish" option SHALL be shown. **For imported recipes, a "Share" action SHALL be shown instead of "Publish".**

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

## ADDED Requirements

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
