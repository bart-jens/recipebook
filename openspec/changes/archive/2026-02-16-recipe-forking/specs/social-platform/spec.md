## MODIFIED Requirements

### Requirement: Activity feed
The system SHALL provide an activity feed showing recent actions by users you follow. Activities include: published a recipe, cooked a recipe (logged a cook_log entry), forked a recipe. The feed SHALL be ordered by recency and paginated. "Cooked It" events (from cook_log) SHALL be the primary social signal in the feed. **Fork events SHALL show "forked [recipe title]" with a link to the user's fork and attribution to the original.**

#### Scenario: Feed shows followed user's fork
- **WHEN** user A follows user B, and user B forks recipe X
- **THEN** user A's feed SHALL show "B forked [X's title]"
- **AND** the feed item SHALL link to B's forked copy

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

### Requirement: Recipe discovery
The system SHALL provide a public discovery page where users can browse canonical (public) recipes. Discovery SHALL support: search by title (case-insensitive ILIKE), filter by tags, sort by newest (published_at desc), highest rated (avg rating desc), most popular (rating count desc), **and most forked (fork count desc)**. Discovery only shows public recipes, never private or subscribers-only. **Each recipe card SHALL include the fork count.**

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
