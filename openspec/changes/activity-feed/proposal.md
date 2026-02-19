## Why

The activity feed currently shows only two event types (cooked, published) and lacks recipe imagery or rating context. The feed feels sparse even when friends are active. Adding more event types (rated, shared), richer cards with recipe thumbnails, and an interaction layer (quick-react) turns the feed from a static log into the social heartbeat of EefEats.

## What Changes

- **New event types**: Add `rated` (with star count) and `shared` (recommendation shares) events to the feed view
- **Richer feed cards**: Show recipe thumbnail in every feed item, star rating inline for rated events, cook notes as quotes
- **Event deduplication**: Collapse multiple events from the same user on the same recipe within a time window (e.g. "cooked and rated Pad Thai")
- **Quick reactions**: Tap to react to feed items with a simple "looks good" acknowledgment (lightweight social signal, not full comments)
- **New follower events**: Show "X started following you" in feed (self-only, not visible to others)
- **Feed badge**: Show unread count badge on Home tab (mobile) and nav link (web) when new events arrive since last visit
- **Pull-to-refresh polish (mobile)**: Haptic feedback on new items arriving

## Capabilities

### New Capabilities
- `feed-reactions`: Lightweight reactions on feed items (quick-react tap, stored in DB, shown as count)

### Modified Capabilities
- `activity-feed`: Add rated/shared event types, event deduplication, richer card layout, unread tracking, feed badge

## Impact

- **Database**: Update `activity_feed_view` with new UNION branches, add `feed_reactions` table, add `feed_last_seen` column or table for unread tracking
- **Web**: Update `activity-feed.tsx` component with richer cards, reaction buttons, unread badge on nav
- **Mobile**: Update home tab feed section with richer cards, reactions, tab badge
- **RPC**: Update `get_activity_feed` return type to include rating value and event metadata
