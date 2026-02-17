## MODIFIED Requirements

### Requirement: Activity feed view
The database SHALL have a view `activity_feed_view` that returns a unified feed of social events. The view SHALL UNION two event types: cook events (from cook_log) and publish events (from recipes where published_at IS NOT NULL). Each row SHALL include: event_type ('cooked', 'published'), user_id, recipe_id, event_at (timestamp of the event), and notes (for cook events only).

#### Scenario: Cook event in feed
- **GIVEN** user B logged a cook on recipe X at 2026-02-15 18:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'cooked', user_id = B, recipe_id = X, event_at = 2026-02-15 18:00

#### Scenario: Publish event in feed
- **GIVEN** user B published recipe X at 2026-02-14 12:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'published', user_id = B, recipe_id = X, event_at = 2026-02-14 12:00

### Requirement: Feed UI on home screen (web)
The web home dashboard SHALL include a "Your Chefs" section showing the activity feed. Each feed item SHALL display: user avatar and display_name (linked to profile), action verb ("cooked" / "published"), recipe title and thumbnail (linked to recipe detail), relative timestamp ("2h ago", "yesterday"), and for cook events: the notes if present.

#### Scenario: Cook event display
- **GIVEN** user B cooked "Pad Thai" 3 hours ago with notes "Extra spicy this time"
- **THEN** the feed item SHALL show B's avatar, "cooked Pad Thai", "3h ago", and the notes

#### Scenario: Publish event display
- **GIVEN** user B published "Homemade Ramen" yesterday
- **THEN** the feed item SHALL show B's avatar, "published Homemade Ramen", and "yesterday"

#### Scenario: Tapping recipe in feed
- **WHEN** user taps the recipe title/thumbnail in a feed item
- **THEN** the user SHALL be navigated to the recipe detail page

#### Scenario: Tapping user in feed
- **WHEN** user taps the avatar/name in a feed item
- **THEN** the user SHALL be navigated to that user's profile page

### Requirement: Feed UI on home tab (mobile)
The mobile home tab SHALL include the activity feed under the "Your Chefs" header with the same content as web. Feed items SHALL use the same display format. Infinite scroll SHALL load more items on scroll. Pull-to-refresh SHALL reload the feed.

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
- **THEN** a message SHALL be shown: "Find Chefs to follow"
- **AND** a subtitle SHALL read: "See what other Chefs are cooking and get inspired"
- **AND** a "Discover Chefs" button SHALL navigate to the Discover page with the Chefs tab selected

#### Scenario: Following users but no activity
- **GIVEN** user A follows users but none have recent activity
- **WHEN** user A views the feed
- **THEN** a message SHALL be shown: "Your Chefs haven't been cooking lately"
- **AND** a link to the user's recipe collection SHALL be provided

## REMOVED Requirements

### Requirement: Fork event in feed
**Reason**: Fork functionality is being removed from the platform. Fork events are no longer generated or displayed.
**Migration**: The 'forked' UNION is removed from `activity_feed_view`. The `get_activity_feed` RPC no longer returns fork events. Feed UI no longer handles event_type = 'forked'.

### Requirement: Fork event display
**Reason**: Fork functionality is being removed. No fork events to display.
**Migration**: Remove fork event rendering from activity feed components on both web and mobile.
