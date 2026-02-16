# Recipe Publishing

Publish original personal recipes as public canonical recipes, browse and discover public recipes, and enforce free-tier publishing limits.

---

## ADDED Requirements

### Requirement: Publish flow
The system SHALL allow a recipe owner to publish a personal recipe by setting its visibility to 'public'. Publishing SHALL only be available for original recipes (source_type = 'manual'). Publishing SHALL set `published_at` to the current timestamp. A confirmation dialog SHALL be shown before publishing. After publishing, the recipe SHALL appear in the discovery page.

#### Scenario: Publishing a recipe
- **WHEN** user taps "Publish" on their private original recipe and confirms
- **THEN** the recipe's visibility SHALL be set to 'public'
- **AND** published_at SHALL be set to now()
- **AND** a success message SHALL be shown

#### Scenario: Publish confirmation
- **WHEN** user taps "Publish" on a private recipe
- **THEN** a confirmation dialog SHALL be shown: "Publishing will make this recipe visible to everyone. Continue?"
- **AND** the recipe SHALL NOT be published until the user confirms

#### Scenario: Publish not available for imported recipes
- **WHEN** user views an imported recipe (source_type != 'manual')
- **THEN** the publish action SHALL NOT be shown
- **AND** the share action SHALL be shown instead

### Requirement: Unpublish flow
The system SHALL allow a recipe owner to unpublish a public recipe by setting its visibility back to 'private'. Unpublishing SHALL clear `published_at`. A confirmation dialog SHALL be shown before unpublishing.

#### Scenario: Unpublishing a recipe
- **WHEN** user taps "Unpublish" on their public recipe and confirms
- **THEN** the recipe's visibility SHALL be set to 'private'
- **AND** published_at SHALL be set to null
- **AND** the recipe SHALL no longer appear in discovery

#### Scenario: Unpublish confirmation
- **WHEN** user taps "Unpublish" on a public recipe
- **THEN** a confirmation dialog SHALL be shown: "This will remove the recipe from public discovery. Continue?"

### Requirement: Discovery page
The system SHALL provide a discovery page where users can browse public canonical recipes. The page SHALL support: search by title (case-insensitive), filter by tags, and sort by: Newest (published_at desc), Highest Rated (average rating desc), Most Popular (rating count desc). Only recipes with visibility = 'public' SHALL appear.

#### Scenario: Browsing discovery
- **WHEN** a user opens the discovery page
- **THEN** public recipes SHALL be displayed sorted by Newest (default)
- **AND** each recipe SHALL show as a recipe card

#### Scenario: Searching by title
- **WHEN** a user types "pasta" in the discovery search bar
- **THEN** only public recipes with "pasta" in the title (case-insensitive) SHALL be shown

#### Scenario: Filtering by tag
- **WHEN** a user selects the tag "Italian" from the filter
- **THEN** only public recipes tagged "Italian" SHALL be shown
- **AND** the active filter SHALL be visually indicated

#### Scenario: Sorting by highest rated
- **WHEN** a user selects "Highest Rated" sort
- **THEN** recipes SHALL be ordered by average rating descending
- **AND** recipes with no ratings SHALL appear at the bottom

#### Scenario: Empty discovery
- **WHEN** no public recipes exist (or none match the search/filter)
- **THEN** a friendly empty state SHALL be shown: "No recipes found. Try a different search or check back later."

#### Scenario: Pagination
- **WHEN** the user scrolls to the bottom of the discovery list
- **THEN** the next page of results SHALL be loaded (20 recipes per page)

### Requirement: Recipe card
The system SHALL display public recipes as cards on the discovery page and profile pages. Each card SHALL show: recipe image (primary image or placeholder), title, creator name and avatar (linked to creator profile), aggregate rating (stars + count), up to 3 tags, and cook time (if set).

#### Scenario: Card with full data
- **GIVEN** a public recipe with image, 4.2 avg rating from 15 ratings, tags ["Italian", "Pasta", "Quick"], and 30 min cook time
- **THEN** the card SHALL show the image, title, creator info, "4.2 (15)", tags "Italian, Pasta, Quick", and "30 min"

#### Scenario: Card with no image
- **GIVEN** a public recipe with no primary image
- **THEN** the card SHALL show a placeholder image (styled, not broken image icon)

#### Scenario: Card with no ratings
- **GIVEN** a public recipe with no ratings
- **THEN** the rating area SHALL show "No ratings yet" or be hidden

#### Scenario: Tapping a card
- **WHEN** a user taps a recipe card
- **THEN** the user SHALL be navigated to the recipe detail page

### Requirement: Creator attribution on recipe detail
The recipe detail page for public recipes SHALL show the creator's display name and avatar, linked to their profile page. For the recipe owner viewing their own public recipe, the publish status and unpublish option SHALL be shown.

#### Scenario: Viewing a public recipe by another user
- **WHEN** user A views user B's public recipe
- **THEN** the detail page SHALL show "By [B's display_name]" with B's avatar
- **AND** tapping the creator name SHALL navigate to B's profile

#### Scenario: Viewing own public recipe
- **WHEN** user A views their own public recipe
- **THEN** the detail page SHALL show a "Published" badge
- **AND** an "Unpublish" option SHALL be available

### Requirement: Free tier publish limit
Free users SHALL be limited to publishing a maximum of 10 recipes. Premium users SHALL have no publishing limit. The limit SHALL be enforced at both client and server level.

#### Scenario: Free user under limit
- **GIVEN** a free user has published 7 recipes
- **THEN** the publish button SHALL be enabled
- **AND** a counter SHALL show "7/10 published"

#### Scenario: Free user at limit
- **GIVEN** a free user has published 10 recipes
- **THEN** the publish button SHALL be disabled
- **AND** a message SHALL be shown: "Upgrade to Premium for unlimited publishing"

#### Scenario: Premium user no limit
- **GIVEN** a premium user has published 50 recipes
- **THEN** the publish button SHALL be enabled
- **AND** no limit counter SHALL be shown

#### Scenario: Server-side enforcement
- **WHEN** a free user at the 10-recipe limit attempts to publish via direct API call
- **THEN** the update SHALL be rejected
