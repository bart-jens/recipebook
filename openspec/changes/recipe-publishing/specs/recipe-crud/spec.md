# Recipe CRUD — Delta Spec (recipe-publishing change)

Updates to recipe detail display for public recipes with creator attribution and aggregate ratings.

---

## MODIFIED Requirements

### Requirement: Recipe detail view
The recipe detail page SHALL display the full recipe: title, description, ingredients, instructions, time/servings, tags, images, and ratings. For public recipes, the page SHALL additionally show the creator's display name and avatar (linked to their profile). For the owner's own public recipes, a "Published" badge and "Unpublish" option SHALL be shown.

#### Scenario: Viewing a public recipe by another creator
- **WHEN** user A views user B's public recipe
- **THEN** the page SHALL display the recipe content
- **AND** SHALL show "By [B's display_name]" with B's avatar, linked to B's profile

#### Scenario: Viewing own public recipe
- **WHEN** user A views their own public recipe
- **THEN** the page SHALL show a "Published" badge
- **AND** an "Unpublish" option SHALL be available

#### Scenario: Viewing a private recipe (unchanged)
- **WHEN** user A views their own private recipe
- **THEN** the page SHALL display the recipe content without creator attribution or publish badge
- **AND** a "Publish" option SHALL be available

#### Scenario: Aggregate ratings on public recipe
- **GIVEN** a public recipe has ratings from multiple users
- **THEN** the detail page SHALL show the aggregate average rating and total count
