## Context

The social graph (user_follows) and interaction signals (cook_log, recipe publishing, forking) exist in the database. The activity feed derives from these tables — no new event storage needed. The feed answers "what are my friends cooking?" and is chronological by design principle ("social without noise — no algorithmic feed manipulation").

## Goals / Non-Goals

**Goals:**
- Show activity from followed users on the home screen
- Three activity types: cooked (cook_log), published (recipes.published_at), forked (recipes.forked_from_id + created_at)
- Chronological order, cursor-based pagination
- Efficient query that works at invite scale
- Web home dashboard + mobile home tab

**Non-Goals:**
- Algorithmic ranking or personalization
- Push notifications for feed activity (future)
- Activity from non-followed users (that's Discover, not the feed)
- Aggregation ("User cooked 3 recipes today" — show individual events)
- Like/comment on feed items (not part of EefEats interaction model)

## Decisions

### 1. Query-based feed, no events table

**Decision:** The feed is a UNION query across cook_log, recipes (for published_at), and recipes (for forks). No separate `activities` or `events` table.

**Rationale:** At invite scale, this query is fast. An events table adds write amplification (every cook/publish/fork triggers an insert) and consistency concerns (what if the event insert fails?). The source-of-truth tables already have the data. A denormalized events table is a scale optimization we don't need yet.

```sql
-- Pseudocode for feed query
SELECT 'cooked' AS type, cl.user_id, cl.recipe_id, cl.cooked_at AS event_at, cl.notes
FROM cook_log cl
JOIN user_follows uf ON uf.following_id = cl.user_id AND uf.follower_id = auth.uid()

UNION ALL

SELECT 'published' AS type, r.created_by AS user_id, r.id AS recipe_id, r.published_at AS event_at, NULL
FROM recipes r
JOIN user_follows uf ON uf.following_id = r.created_by AND uf.follower_id = auth.uid()
WHERE r.visibility = 'public' AND r.published_at IS NOT NULL

UNION ALL

SELECT 'forked' AS type, r.created_by AS user_id, r.id AS recipe_id, r.created_at AS event_at, NULL
FROM recipes r
JOIN user_follows uf ON uf.following_id = r.created_by AND uf.follower_id = auth.uid()
WHERE r.forked_from_id IS NOT NULL

ORDER BY event_at DESC
LIMIT 20 OFFSET ?
```

### 2. Database view for feed

**Decision:** Create a Postgres view `activity_feed_view` that encapsulates the UNION query. The application queries this view with user-specific filtering via RLS or function parameter.

**Rationale:** Keeps the complex query in SQL, not scattered across application code. The view can be evolved independently (add new event types) without changing app code. Since it's a view (not materialized), it always reflects current data.

**Alternative considered:** Supabase RPC function that takes user_id and returns feed. Also viable, but a view with RLS is more idiomatic for Supabase.

### 3. Cursor-based pagination

**Decision:** Use `event_at` timestamp as cursor. Client sends `before=<timestamp>` to get older items.

**Rationale:** Offset-based pagination breaks with real-time inserts (items shift). Cursor-based is stable. Using timestamp rather than ID because events come from different tables with different ID sequences.

**Edge case:** Multiple events at the same timestamp. Mitigated by also including a tiebreaker (event type + ID). At current scale, timestamp collisions are negligible.

### 4. Feed item display

**Decision:** Each feed item shows: user avatar + display_name, action verb ("cooked" / "published" / "forked"), recipe title + thumbnail, timestamp (relative — "2 hours ago"), and for cook events: optional notes. Tapping the recipe navigates to recipe detail. Tapping the user navigates to their profile.

### 5. Empty state

**Decision:** Two empty states:
1. Not following anyone: "Follow friends to see what they're cooking. Browse Discover to find people."
2. Following people but no activity: "Your friends haven't been cooking lately. Why not cook something yourself?"

## Risks / Trade-offs

**[UNION query performance]** → Three-way UNION with JOINs. At invite scale (2 users, <100 recipes), this is sub-millisecond. At scale (1000s of users), would need a materialized events table or caching layer. Documented as a known scale limitation.

**[No real-time updates]** → Feed refreshes on page load / pull-to-refresh. No WebSocket or polling for live updates. Acceptable for current use case — you check the app, you see what happened.

**[Published_at as event timestamp]** → If a user unpublishes and republishes, the published_at resets to now(). This would create a "new" feed event. Acceptable behavior — it is a new publication.
