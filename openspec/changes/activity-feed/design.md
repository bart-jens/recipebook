## Context

The activity feed exists and works (DB view + RPC + UI on web and mobile). It currently shows two event types: `cooked` and `published`, with basic text cards. The feed feels sparse and lacks the visual richness to be a compelling daily destination. There's no way to interact with feed items or know if new activity has happened.

Current architecture:
- `activity_feed_view`: SQL view UNIONing cook_log and recipes (public only)
- `get_activity_feed` RPC: SECURITY DEFINER, joins user_profiles + recipes, cursor-based pagination
- Web: `activity-feed.tsx` client component with "Load more" button
- Mobile: home tab with infinite scroll, pull-to-refresh

## Goals / Non-Goals

**Goals:**
- Add `rated` and `shared` event types to the feed
- Collapse duplicate events (same user + same recipe within a time window) into combined cards
- Add lightweight reactions on feed items ("looks good" acknowledgment)
- Track "last seen" to power unread badge on Home tab/nav
- Richer feed cards with recipe thumbnails on every item

**Non-Goals:**
- Full comment system (too heavy for this stage)
- Push notifications for feed events (future, needs Expo Notifications)
- Algorithmic feed ranking (chronological only)
- Feed for non-followed users (that's Discover)

## Decisions

### 1. Event deduplication: application-level, not SQL
Collapsing "cooked and rated Pad Thai" in the SQL view would make pagination complex (window functions + cursor math). Instead, the RPC returns raw events and the client merges events from the same user + recipe within a 5-minute window. This keeps the DB simple and gives the client control over presentation.

**Alternative**: SQL-level deduplication with `DISTINCT ON` or window functions. Rejected because it complicates cursor-based pagination and makes the view harder to maintain.

### 2. Reactions: single-emoji "looks good" only
Not a full reaction picker. One reaction type (a simple "fire" or thumbs-up). Stored in `feed_reactions` table with unique constraint on (user_id, event_type, source_id). Keeps it lightweight — social acknowledgment without the complexity of comments.

**Alternative**: Multiple emoji reactions. Rejected as premature — can always expand later. One reaction type is simpler to build, simpler UX, and tests whether people want to interact at all.

### 3. Unread tracking: `feed_last_seen_at` column on user_profiles
Add a single timestamp column to `user_profiles`. When the user views the feed, update it. Compare against the latest event_at from `get_activity_feed` to determine if there are unseen items. No separate table needed.

**Alternative**: Separate `feed_state` table. Rejected — over-engineered for a single timestamp. Can migrate later if we need per-item read state.

### 4. Rated events: from recipe_ratings, not cook_log
`recipe_ratings` has the star value. The feed should show "rated Pad Thai 4/5" with visible stars. Only show ratings on public recipes (same visibility filter as other events).

### 5. Shared events: from recipe_shares table
`recipe_shares` already stores when users share/recommend recipes. Adding these to the feed makes the "share" action more visible socially.

## Risks / Trade-offs

- **Feed view performance**: Adding two more UNION branches increases query complexity. Mitigation: the RPC already limits to 20 items per page and filters via index on user_follows. At invite scale this is fine. Add materialized view if needed later.
- **Reaction spam**: A user could react to everything. Mitigation: unique constraint (one reaction per user per event). Rate limiting not needed at invite scale.
- **Client-side dedup complexity**: Merging events on the client adds logic to both web and mobile. Mitigation: keep the merge simple — same user_id + recipe_id within 5 minutes. Share a utility function pattern between platforms.

## Open Questions

- Should the feed badge count show exact number or just a dot indicator? Leaning dot (simpler, less noisy).
