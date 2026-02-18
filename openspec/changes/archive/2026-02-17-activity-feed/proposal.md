## Why

With the social interaction model in place (cook_log, saved_recipes, recipe_favorites), the platform generates meaningful social signals. But there's no way to see what friends are doing. The activity feed is the core retention loop — "see what your friends are cooking" drives daily return visits. It turns EefEats from a recipe notebook into a social platform.

## What Changes

- **Database view `activity_feed_view`** — Unified feed of cook events (from cook_log) and publish events (from recipes where published_at IS NOT NULL). Returns event_type, user_id, recipe_id, event_at, notes.
- **Feed query scoped to followed users** — Only shows events from users you follow. Ordered by event_at descending.
- **Cursor-based pagination** — 20 items per page, cursor on event_at timestamp.
- **Web home dashboard** — "Your Chefs" section showing the activity feed with user avatars, action verbs, recipe thumbnails, and relative timestamps.
- **Mobile home tab** — Same feed with infinite scroll and pull-to-refresh.
- **Empty states** — "Find Chefs to follow" when following nobody, "Your Chefs haven't been cooking lately" when no activity.
- **Both web and mobile** — Full parity.

## Capabilities

### New Capabilities

_(None — activity-feed spec already exists)_

### Modified Capabilities

- `activity-feed`: Implementing the existing spec (database view, feed queries, web UI, mobile UI, empty states, pagination)
- `social-platform`: Implementing the home screen layout with activity feed section

## Impact

**Database:** New view `activity_feed_view`, RPC function for paginated feed query
**Web:** Home dashboard updated with "Your Chefs" activity feed section, remove trending/recommendation cards
**Mobile:** Home tab updated with activity feed, infinite scroll, pull-to-refresh
**Dependencies:** Requires `social-interaction-model` change (cook_log table must exist)
