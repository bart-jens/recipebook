## MODIFIED Requirements

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
