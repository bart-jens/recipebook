## ADDED Requirements

### Requirement: Activity feed view
The database SHALL have a view `activity_feed_view` that returns a unified feed of social events. The view SHALL UNION three event types: cook events (from cook_log), publish events (from recipes where published_at IS NOT NULL), and fork events (from recipes where forked_from_id IS NOT NULL). Each row SHALL include: event_type ('cooked', 'published', 'forked'), user_id, recipe_id, event_at (timestamp of the event), and notes (for cook events only).

#### Scenario: Cook event in feed
- **GIVEN** user B logged a cook on recipe X at 2026-02-15 18:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'cooked', user_id = B, recipe_id = X, event_at = 2026-02-15 18:00

#### Scenario: Publish event in feed
- **GIVEN** user B published recipe X at 2026-02-14 12:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'published', user_id = B, recipe_id = X, event_at = 2026-02-14 12:00

#### Scenario: Fork event in feed
- **GIVEN** user B forked recipe X at 2026-02-13 10:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'forked', user_id = B, recipe_id = B's fork ID, event_at = 2026-02-13 10:00

### Requirement: Feed query scoped to followed users
The application SHALL query the activity feed filtered to users that the current user follows. Only events from followed users SHALL appear. The feed SHALL be ordered by event_at descending (newest first).

#### Scenario: Feed shows followed user's activity
- **GIVEN** user A follows user B
- **WHEN** user A queries the activity feed
- **THEN** events from user B SHALL appear in the feed

#### Scenario: Feed excludes unfollowed users
- **GIVEN** user A does not follow user C
- **WHEN** user A queries the activity feed
- **THEN** events from user C SHALL NOT appear

#### Scenario: Feed ordering
- **GIVEN** user B cooked at 18:00 and user D published at 17:00
- **AND** user A follows both B and D
- **WHEN** user A queries the feed
- **THEN** B's cook event SHALL appear before D's publish event

### Requirement: Feed pagination
The feed SHALL support cursor-based pagination using the event_at timestamp. The client SHALL pass a `before` timestamp to fetch older events. Each page SHALL return up to 20 items.

#### Scenario: First page
- **WHEN** user A loads the feed without a cursor
- **THEN** the 20 most recent events from followed users SHALL be returned

#### Scenario: Next page
- **GIVEN** the last event on page 1 has event_at = 2026-02-10 12:00
- **WHEN** user A loads the next page with before = 2026-02-10 12:00
- **THEN** the next 20 events older than that timestamp SHALL be returned

#### Scenario: End of feed
- **WHEN** fewer than 20 events exist after the cursor
- **THEN** all remaining events SHALL be returned
- **AND** the client SHALL know there are no more pages

### Requirement: Feed UI on home screen (web)
The web home dashboard SHALL include a "Friends are cooking" section showing the activity feed. Each feed item SHALL display: user avatar and display_name (linked to profile), action verb ("cooked" / "published" / "forked"), recipe title and thumbnail (linked to recipe detail), relative timestamp ("2h ago", "yesterday"), and for cook events: the notes if present.

#### Scenario: Cook event display
- **GIVEN** user B cooked "Pad Thai" 3 hours ago with notes "Extra spicy this time"
- **THEN** the feed item SHALL show B's avatar, "cooked Pad Thai", "3h ago", and the notes

#### Scenario: Publish event display
- **GIVEN** user B published "Homemade Ramen" yesterday
- **THEN** the feed item SHALL show B's avatar, "published Homemade Ramen", and "yesterday"

#### Scenario: Fork event display
- **GIVEN** user B forked "Classic Tiramisu" 5 hours ago
- **THEN** the feed item SHALL show B's avatar, "forked Classic Tiramisu", and "5h ago"

#### Scenario: Tapping recipe in feed
- **WHEN** user taps the recipe title/thumbnail in a feed item
- **THEN** the user SHALL be navigated to the recipe detail page

#### Scenario: Tapping user in feed
- **WHEN** user taps the avatar/name in a feed item
- **THEN** the user SHALL be navigated to that user's profile page

### Requirement: Feed UI on home tab (mobile)
The mobile home tab SHALL include the activity feed with the same content as web. Feed items SHALL use the same display format. Infinite scroll SHALL load more items on scroll. Pull-to-refresh SHALL reload the feed.

#### Scenario: Pull to refresh
- **WHEN** user pulls down on the feed
- **THEN** the feed SHALL reload with the latest events

#### Scenario: Infinite scroll
- **WHEN** user scrolls to the bottom of the feed
- **THEN** the next page of events SHALL be loaded

#### Scenario: Haptic feedback on new items
- **WHEN** pull-to-refresh returns new events
- **THEN** haptic feedback SHALL be triggered

### Requirement: Feed empty states
The feed SHALL handle two empty states with distinct messages and calls to action.

#### Scenario: Not following anyone
- **GIVEN** user A follows zero users
- **WHEN** user A views the feed
- **THEN** a message SHALL be shown: "Follow friends to see what they're cooking"
- **AND** a link to the Discover page SHALL be provided

#### Scenario: Following users but no activity
- **GIVEN** user A follows users but none have recent activity
- **WHEN** user A views the feed
- **THEN** a message SHALL be shown: "Your friends haven't been cooking lately. Why not cook something yourself?"
- **AND** a link to the user's recipe collection SHALL be provided
