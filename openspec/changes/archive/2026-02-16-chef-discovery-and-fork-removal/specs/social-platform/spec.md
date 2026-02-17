## MODIFIED Requirements

### Requirement: Recipe discovery
The system SHALL provide a public discovery page where users can browse canonical (public) recipes. Discovery SHALL support: search by title (case-insensitive ILIKE), filter by tags, sort by newest (published_at desc), highest rated (avg rating desc), most popular (rating count desc). Discovery only shows public recipes, never private or subscribers-only.

#### Scenario: Search public recipes
- **WHEN** a user searches for "pasta" in discovery
- **THEN** only public recipes with "pasta" in the title SHALL be returned

#### Scenario: Private recipes excluded
- **WHEN** a user browses discovery
- **THEN** recipes with visibility 'private' SHALL NOT appear

#### Scenario: Subscribers-only recipes excluded from discovery
- **WHEN** a user browses discovery
- **THEN** recipes with visibility 'subscribers' SHALL NOT appear in the discovery page

#### Scenario: Sort by highest rated
- **WHEN** a user selects "Top Rated" sort
- **THEN** recipes SHALL be ordered by average rating descending

#### Scenario: Sort by most popular
- **WHEN** a user selects "Most Popular" sort
- **THEN** recipes SHALL be ordered by rating count descending

### Requirement: Activity feed
The system SHALL provide an activity feed showing recent actions by users you follow. Activities include: published a recipe, cooked a recipe (logged a cook_log entry). The feed SHALL be ordered by recency and paginated. "Cooked It" events (from cook_log) SHALL be the primary social signal in the feed. **The feed SHALL be implemented as a database view (activity_feed_view) queried with user-specific filtering. Pagination SHALL be cursor-based using event_at timestamp, 20 items per page. The feed SHALL be displayed on the home screen (web dashboard) and home tab (mobile).**

#### Scenario: Feed shows followed user's cooking activity
- **WHEN** user A follows user B, and user B logs a cook on a recipe
- **THEN** user A's feed SHALL show "B cooked [recipe title]"

#### Scenario: Feed shows followed user's publication
- **WHEN** user A follows user B, and user B publishes a recipe
- **THEN** user A's feed SHALL show "B published [recipe title]"

#### Scenario: Feed excludes unfollowed users
- **WHEN** user A does not follow user C
- **THEN** user C's activity SHALL NOT appear in user A's feed

#### Scenario: Feed shows cooking notes
- **WHEN** user B logs a cook with notes "Added extra chili"
- **THEN** user A's feed entry SHALL include the note text

#### Scenario: Feed pagination
- **GIVEN** the feed has more than 20 events
- **WHEN** user scrolls past the first 20
- **THEN** the next 20 events SHALL be loaded using cursor-based pagination

#### Scenario: Empty feed — not following anyone
- **GIVEN** user A follows zero users
- **WHEN** user A views the feed
- **THEN** a message SHALL prompt them to discover and follow Chefs

#### Scenario: Empty feed — no activity
- **GIVEN** user A follows users but none have recent activity
- **WHEN** user A views the feed
- **THEN** a message SHALL suggest cooking something themselves

### Requirement: Home screen layout
The home screen SHALL contain three sections in order: (1) greeting with the user's display name, (2) "Your Recipes" showing the user's recently updated recipes as a carousel, (3) "Your Chefs" showing the activity feed from followed users. The home screen SHALL NOT contain trending recipes or recommendation cards.

#### Scenario: Home screen sections
- **WHEN** user views the home screen
- **THEN** the page SHALL display greeting, Your Recipes carousel, and Your Chefs activity feed
- **AND** no trending recipes section SHALL be present
- **AND** no recommendation cards section SHALL be present

#### Scenario: Your Recipes empty state
- **GIVEN** user has no recipes
- **WHEN** user views the home screen
- **THEN** the Your Recipes section SHALL show "No recipes yet" with a link to create one

#### Scenario: Your Chefs empty state — not following
- **GIVEN** user follows zero Chefs
- **WHEN** user views the home screen
- **THEN** the Your Chefs section SHALL show "Find Chefs to follow" with subtitle "See what other Chefs are cooking and get inspired"
- **AND** a "Discover Chefs" button SHALL navigate to the Discover page with the Chefs tab pre-selected

#### Scenario: Your Chefs empty state — no activity
- **GIVEN** user follows Chefs but none have recent activity
- **WHEN** user views the home screen
- **THEN** the Your Chefs section SHALL show "Your Chefs haven't been cooking lately"

## REMOVED Requirements

### Requirement: Sort by most forked
**Reason**: Fork functionality is being removed from the platform. Fork count is no longer a meaningful discovery signal.
**Migration**: The "Most Forked" sort option is removed from the Discover page. Replaced by existing "Most Popular" (rating count) sort.

### Requirement: Fork count on recipe card
**Reason**: Fork functionality is being removed. Fork counts are no longer displayed.
**Migration**: Remove fork count from recipe card components on Discover and profile pages. No replacement needed.
