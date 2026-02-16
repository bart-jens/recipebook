## MODIFIED Requirements

### Requirement: Public ratings on canonical recipes
The existing `recipe_ratings` table SHALL work for both personal and canonical recipes. When a recipe is public, all ratings from all users are visible. The recipe card and detail page SHALL show the aggregate average and count. **A user SHALL NOT be able to insert a rating unless they have at least one cook_log entry for that recipe.** This gate SHALL be enforced via RLS policy on insert.

#### Scenario: Aggregate rating display
- **GIVEN** recipe X has ratings of 4, 5, 3 from three users
- **THEN** the displayed average SHALL be 4.0 with count "3 ratings"

#### Scenario: Rating a public recipe after cooking
- **GIVEN** user A has at least one cook_log entry for public recipe X
- **WHEN** user A rates public recipe X with 4 stars and a note
- **THEN** the rating SHALL be visible to all users viewing recipe X

#### Scenario: Rating a public recipe without cooking
- **GIVEN** user A has no cook_log entries for public recipe X
- **WHEN** user A attempts to rate public recipe X
- **THEN** the insert SHALL be rejected by the RLS policy

#### Scenario: Rating own recipe after cooking
- **GIVEN** user A has at least one cook_log entry for their own recipe X
- **WHEN** user A rates recipe X with 5 stars
- **THEN** the rating SHALL be inserted

### Requirement: Recipe discovery
The system SHALL provide a public discovery page where users can browse canonical (public) recipes. Discovery SHALL support: search by title (case-insensitive ILIKE), filter by tags, sort by newest (published_at desc), highest rated (avg rating desc), most popular (rating count desc), and most forked (fork count desc). Discovery only shows public recipes, never private or subscribers-only. Each recipe card SHALL include the fork count.

#### Scenario: Search public recipes
- **WHEN** a user searches for "pasta" in discovery
- **THEN** only public recipes with "pasta" in the title SHALL be returned

#### Scenario: Private recipes excluded
- **WHEN** a user browses discovery
- **THEN** recipes with visibility 'private' SHALL NOT appear

#### Scenario: Subscribers-only recipes excluded from discovery
- **WHEN** a user browses discovery
- **THEN** recipes with visibility 'subscribers' SHALL NOT appear in the discovery page

#### Scenario: Sort by most forked
- **WHEN** a user selects "Most Forked" sort
- **THEN** recipes SHALL be ordered by fork count descending

#### Scenario: Fork count on recipe card
- **GIVEN** recipe X has been forked 7 times
- **WHEN** recipe X appears on the discover page
- **THEN** the recipe card SHALL show a fork count of 7

### Requirement: Activity feed
The system SHALL provide an activity feed showing recent actions by users you follow. Activities include: published a recipe, cooked a recipe (logged a cook_log entry), forked a recipe. The feed SHALL be ordered by recency and paginated. "Cooked It" events (from cook_log) SHALL be the primary social signal in the feed. **The feed SHALL be implemented as a database view (activity_feed_view) queried with user-specific filtering. Pagination SHALL be cursor-based using event_at timestamp, 20 items per page. The feed SHALL be displayed on the home screen (web dashboard) and home tab (mobile).**

#### Scenario: Feed shows followed user's cooking activity
- **WHEN** user A follows user B, and user B logs a cook on a recipe
- **THEN** user A's feed SHALL show "B cooked [recipe title]"

#### Scenario: Feed shows followed user's publication
- **WHEN** user A follows user B, and user B publishes a recipe
- **THEN** user A's feed SHALL show "B published [recipe title]"

#### Scenario: Feed shows followed user's fork
- **WHEN** user A follows user B, and user B forks recipe X
- **THEN** user A's feed SHALL show "B forked [X's title]"
- **AND** the feed item SHALL link to B's forked copy with attribution to the original

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
- **THEN** a message SHALL prompt them to discover and follow users

#### Scenario: Empty feed — no activity
- **GIVEN** user A follows users but none have recent activity
- **WHEN** user A views the feed
- **THEN** a message SHALL suggest cooking something themselves
