## MODIFIED Requirements

### Requirement: Activity feed view
The database SHALL have a view `activity_feed_view` that returns a unified feed of social events. The view SHALL UNION three event types: cook events (from cook_log with LEFT JOIN to recipe_ratings for inline rating), publish events (from recipes where published_at IS NOT NULL), and favorited events (from recipe_favorites). Each row SHALL include: event_type ('cooked', 'published', 'favorited'), user_id, recipe_id, event_at (timestamp of the event), notes (for cook events only), and rating (for cook events, from recipe_ratings LEFT JOIN, NULL for others).

#### Scenario: Cook event in feed with rating
- **GIVEN** user B logged a cook on recipe X at 2026-02-15 18:00
- **AND** user B has rated recipe X with 5 stars
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'cooked', user_id = B, recipe_id = X, event_at = 2026-02-15 18:00, rating = 5

#### Scenario: Cook event in feed without rating
- **GIVEN** user B logged a cook on recipe X at 2026-02-15 18:00
- **AND** user B has not rated recipe X
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'cooked', user_id = B, recipe_id = X, event_at = 2026-02-15 18:00, rating = NULL

#### Scenario: Publish event in feed
- **GIVEN** user B published recipe X at 2026-02-14 12:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'published', user_id = B, recipe_id = X, event_at = 2026-02-14 12:00

#### Scenario: Favorited event in feed
- **GIVEN** user B favorited public recipe X at 2026-02-16 10:00
- **THEN** the activity_feed_view SHALL contain a row with event_type = 'favorited', user_id = B, recipe_id = X, event_at = 2026-02-16 10:00, notes = NULL, rating = NULL

#### Scenario: Favorited event only for public recipes
- **GIVEN** user B favorited their own private recipe X
- **THEN** the activity_feed_view SHALL NOT contain a favorited event for recipe X

#### Scenario: No saved or rated event types
- **THEN** the activity_feed_view SHALL NOT contain any rows with event_type = 'saved' or event_type = 'rated'

### Requirement: Feed UI on home screen (web)
The web home dashboard SHALL include a "Your Chefs" section showing the activity feed. Each feed item SHALL display: user avatar and display_name (linked to profile), action verb ("cooked" / "published" / "favorited"), recipe title and thumbnail (linked to recipe detail), relative timestamp ("2h ago", "yesterday"). For cook events: the notes if present, the rating as inline stars if present, and source attribution ("via seriouseats.com") if the recipe has a source_url.

#### Scenario: Cook event display with rating and source
- **GIVEN** user B cooked "Pad Thai" (imported from seriouseats.com) 3 hours ago, rated 4 stars, with notes "Extra spicy"
- **THEN** the feed item SHALL show B's avatar, "cooked Pad Thai", 4 stars, "via seriouseats.com", "Extra spicy", and "3h ago"

#### Scenario: Cook event display without rating
- **GIVEN** user B cooked "Pad Thai" 3 hours ago without rating
- **THEN** the feed item SHALL show B's avatar, "cooked Pad Thai", no stars, and "3h ago"

#### Scenario: Publish event display
- **GIVEN** user B published "Homemade Ramen" yesterday
- **THEN** the feed item SHALL show B's avatar, "published Homemade Ramen", and "yesterday"

#### Scenario: Favorited event display
- **GIVEN** user B favorited "Chocolate Cake" 2 hours ago
- **THEN** the feed item SHALL show B's avatar, "favorited Chocolate Cake", and "2h ago"
- **AND** no rating or notes SHALL be shown for favorited events

#### Scenario: Tapping recipe in feed always links to recipe detail
- **WHEN** user taps the recipe title/thumbnail in any feed item (including cook events for imported recipes)
- **THEN** the user SHALL be navigated to the recipe detail page
- **AND** the link SHALL NOT open an external URL

#### Scenario: Tapping user in feed
- **WHEN** user taps the avatar/name in a feed item
- **THEN** the user SHALL be navigated to that user's profile page

### Requirement: Feed UI on home tab (mobile)
The mobile home tab SHALL include the activity feed under the "Your Chefs" header with the same content and event types as web. Feed items SHALL use the same display format including inline ratings on cook events and source attribution. Infinite scroll SHALL load more items on scroll. Pull-to-refresh SHALL reload the feed.

#### Scenario: Cook event with rating on mobile
- **GIVEN** user B cooked "Pad Thai" and rated it 5 stars
- **THEN** the mobile feed item SHALL show B's name, "cooked Pad Thai", and 5 inline stars

#### Scenario: Favorited event on mobile
- **GIVEN** user B favorited "Chocolate Cake"
- **THEN** the mobile feed item SHALL show B's name, "favorited Chocolate Cake"

#### Scenario: Pull to refresh
- **WHEN** user pulls down on the feed
- **THEN** the feed SHALL reload with the latest events

#### Scenario: Infinite scroll
- **WHEN** user scrolls to the bottom of the feed
- **THEN** the next page of events SHALL be loaded

## REMOVED Requirements

### Requirement: Saved event type in activity feed
**Reason**: The "saved" (recommendation) event type is replaced by enriched cook events. Cook logs with inline ratings serve as natural recommendations. The `recipe_shares` table that powered saved events is being dropped.
**Migration**: Existing "saved" events will disappear from feeds when the view is replaced. No data migration needed — the signal is now carried by cook events.

### Requirement: Rated event type in activity feed
**Reason**: The "rated" event type is merged into "cooked" events. Ratings are now shown inline on cook events via LEFT JOIN to recipe_ratings. This eliminates duplicate feed items for cook+rate actions.
**Migration**: Rating data is preserved in recipe_ratings table. It surfaces through cook events instead of standalone rated events.
