# Activity Feed (Enhanced)

Delta spec for the existing activity feed. Adds new event types, richer cards, event deduplication, and unread tracking.

---

## MODIFIED Requirements

### Requirement: Activity feed view
The database SHALL have a view `activity_feed_view` that returns a unified feed of social events. The view SHALL UNION four event types: cook events (from cook_log), publish events (from recipes where published_at IS NOT NULL), rated events (from recipe_ratings), and shared events (from recipe_shares). Each row SHALL include: event_type ('cooked', 'published', 'rated', 'shared'), user_id, recipe_id, source_id (primary key of the source row), event_at (timestamp), notes (for cook/rated events), and rating (integer, for rated events only, NULL otherwise). All events SHALL be filtered to public recipes only.

#### Scenario: Cook event in feed
- **GIVEN** user B logged a cook on public recipe X at 2026-02-15 18:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'cooked', user_id = B, recipe_id = X, source_id = cook_log.id, event_at = 2026-02-15 18:00

#### Scenario: Publish event in feed
- **GIVEN** user B published recipe X at 2026-02-14 12:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'published', user_id = B, recipe_id = X, event_at = 2026-02-14 12:00

#### Scenario: Rated event in feed
- **GIVEN** user B rated public recipe X with 4 stars at 2026-02-16 10:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'rated', user_id = B, recipe_id = X, rating = 4, event_at = 2026-02-16 10:00

#### Scenario: Shared event in feed
- **GIVEN** user B shared recipe X at 2026-02-16 14:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'shared', user_id = B, recipe_id = X, event_at = 2026-02-16 14:00

#### Scenario: Private recipe excluded
- **GIVEN** user B cooked private recipe Y
- **THEN** the event SHALL NOT appear in the activity_feed_view

### Requirement: Feed query scoped to followed users
The `get_activity_feed` RPC SHALL return events from followed users, ordered by event_at descending. The RPC SHALL additionally return: source_id (uuid), rating (integer, nullable), reaction_count (integer), and user_reacted (boolean). The recipe_image_url SHALL always be included when available.

#### Scenario: Feed shows followed user's activity
- **GIVEN** user A follows user B
- **WHEN** user A queries the activity feed
- **THEN** events from user B SHALL appear in the feed

#### Scenario: Feed excludes unfollowed users
- **GIVEN** user A does not follow user C
- **WHEN** user A queries the activity feed
- **THEN** events from user C SHALL NOT appear

#### Scenario: Rated event shows star count
- **GIVEN** user B rated recipe X with 5 stars
- **WHEN** user A loads the feed
- **THEN** the event SHALL include rating = 5

## ADDED Requirements

### Requirement: Event deduplication on client
The client SHALL merge feed events from the same user on the same recipe within a 5-minute window into a single combined card. The combined card SHALL list all event types (e.g. "cooked and rated Pad Thai"). The most recent event_at SHALL be used for the combined card's timestamp.

#### Scenario: Cook and rate within 5 minutes
- **GIVEN** user B cooked recipe X at 18:00 and rated it at 18:03
- **WHEN** user A views the feed
- **THEN** a single card SHALL show "cooked and rated Pad Thai" with the 18:03 timestamp

#### Scenario: Events more than 5 minutes apart
- **GIVEN** user B cooked recipe X at 18:00 and rated it at 19:00
- **WHEN** user A views the feed
- **THEN** two separate cards SHALL be shown

### Requirement: Richer feed cards
Every feed card SHALL display: user avatar (or initial fallback), display name, action verb(s), recipe title, recipe thumbnail (when available), and relative timestamp. Rated events SHALL display inline star icons showing the rating value. Shared events SHALL show "shared" as the action verb. Cook events with notes SHALL display the notes as an italic quote.

#### Scenario: Rated event card
- **GIVEN** user B rated "Pad Thai" 4 stars
- **THEN** the card SHALL show B's avatar, "rated Pad Thai", 4 filled star icons, and timestamp

#### Scenario: Shared event card
- **GIVEN** user B shared "Homemade Ramen"
- **THEN** the card SHALL show B's avatar, "shared Homemade Ramen", and timestamp

#### Scenario: Cook event with notes
- **GIVEN** user B cooked "Caesar Salad" with notes "Extra anchovies this time"
- **THEN** the card SHALL show the notes in italic below the action line

### Requirement: Unread tracking
A `feed_last_seen_at` column (timestamptz, default now()) SHALL be added to `user_profiles`. When the user views the activity feed, the column SHALL be updated to the current timestamp. The system SHALL compare this timestamp against the latest event_at from followed users to determine if new events exist.

#### Scenario: User views feed
- **WHEN** user A opens the home screen and the feed is visible
- **THEN** `feed_last_seen_at` SHALL be updated to now()

#### Scenario: New events after last seen
- **GIVEN** user A's feed_last_seen_at is 2026-02-16 12:00
- **AND** user B cooked something at 2026-02-16 14:00
- **WHEN** the system checks for new events
- **THEN** the system SHALL indicate that new events exist

### Requirement: Feed badge (mobile)
The mobile Home tab icon SHALL display a small dot indicator when unseen feed events exist. The dot SHALL disappear when the user views the feed (feed_last_seen_at is updated). The dot SHALL NOT show a number — only presence/absence.

#### Scenario: New events show dot
- **GIVEN** new feed events exist since the user's last visit
- **WHEN** user views the tab bar
- **THEN** the Home tab SHALL show a small dot indicator

#### Scenario: Dot clears on view
- **WHEN** user navigates to the Home tab and the feed loads
- **THEN** the dot indicator SHALL be removed

### Requirement: Feed badge (web)
The web navigation SHALL display a small dot indicator on the "Home" link when unseen feed events exist. Behavior SHALL match the mobile badge.

#### Scenario: Web nav shows dot
- **GIVEN** new feed events exist since the user's last visit
- **WHEN** user views the navigation
- **THEN** the Home link SHALL show a small dot indicator
