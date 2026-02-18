## Why

Two bugs in the activity feed ("Updates from Chefs"):

1. **Timing is misleading** — A user does something just now but the feed shows "3h ago". Root cause: the `activity_feed_view` has no visibility filter on cook events. The `get_activity_feed` RPC is `SECURITY DEFINER` (bypasses RLS), so cook events for private recipes appear in the feed. But the recipe detail page uses normal RLS and can't fetch private recipes — so users see stale-looking entries they can't actually open.

2. **404 on recipe click** — Clicking a recipe from the feed leads to a 404. Same root cause: private recipe cook events appear in the feed because the view doesn't filter by visibility. When a user clicks a private recipe they don't own, the recipe detail page can't fetch it (RLS blocks it) → 404.

Both bugs stem from the same missing visibility filter.

## What Changes

- Add `JOIN recipes r ON r.id = cl.recipe_id WHERE r.visibility = 'public'` to cook events in `activity_feed_view`
- This matches the publish events which already filter by `visibility = 'public'`
- Only public recipe cooks appear in the feed — consistent with what users can actually view

## Impact

**Backend / Supabase:**
- New migration: `20240101000025_fix_activity_feed_visibility.sql` — `CREATE OR REPLACE VIEW` with visibility filter on cook events
- The `get_activity_feed` RPC doesn't need changes — it reads from the view

**No frontend changes needed** — the RPC response shape stays the same, just fewer (correct) results.
