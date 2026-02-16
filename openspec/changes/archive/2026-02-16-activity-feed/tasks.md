## 1. Database: Activity Feed View

- [x] 1.1 Create migration: `activity_feed_view` — a Postgres view that UNIONs cook events (cook_log), publish events (recipes where published_at IS NOT NULL and visibility = 'public'), and fork events (recipes where forked_from_id IS NOT NULL). Columns: event_type, user_id, recipe_id, event_at, notes.
- [x] 1.2 Create Supabase RPC function `get_activity_feed(p_user_id uuid, p_before timestamptz, p_limit int)` that queries the view filtered to followed users of p_user_id, ordered by event_at DESC, with cursor pagination and limit.

## 2. Web: Feed on Home Dashboard

- [x] 2.1 Add "Friends are cooking" section to the home dashboard. Query activity feed RPC. Display feed items: user avatar + name, action verb, recipe title + thumbnail, relative timestamp, cook notes (if present). Link recipe to detail, user to profile.
- [x] 2.2 Add "Load more" button or infinite scroll for pagination. Pass last event_at as cursor.
- [x] 2.3 Add empty states: "Follow friends to see what they're cooking" (not following anyone, link to Discover) and "Your friends haven't been cooking lately" (following but no activity, link to own collection).

## 3. Mobile: Feed on Home Tab

- [x] 3.1 Add activity feed to mobile home tab. Same content as web: feed items with avatar, action, recipe preview, timestamp, notes. Tap recipe → detail, tap user → profile.
- [x] 3.2 Implement infinite scroll for pagination. Load next page on scroll to bottom.
- [x] 3.3 Implement pull-to-refresh. Reload feed from latest. Haptic feedback on new items.
- [x] 3.4 Add empty states matching web copy.

## 4. Verification

- [x] 4.1 Verify feed shows only events from followed users, ordered by recency.
- [x] 4.2 Verify pagination: cursor-based loading returns correct older events.
- [x] 4.3 Verify all three event types appear correctly (cooked, published, forked) with correct display format.
- [x] 4.4 Verify empty states render correctly for both conditions.
