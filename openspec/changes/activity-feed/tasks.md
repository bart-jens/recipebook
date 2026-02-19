## 1. Database — Enhanced Feed View & Unread Tracking

- [ ] 1.1 Update `activity_feed_view` to add `rated` events (from recipe_ratings, public recipes only) and `shared` events (from recipe_shares, public recipes only). Add `source_id` and `rating` columns to the view.
- [ ] 1.2 Add `feed_last_seen_at` column (timestamptz, default now()) to `user_profiles`
- [ ] 1.3 Create `feed_reactions` table (id, user_id, event_type, source_id, created_at) with unique constraint on (user_id, event_type, source_id), RLS policies scoped to auth.uid()
- [ ] 1.4 Update `get_activity_feed` RPC to return `source_id`, `rating`, `reaction_count`, and `user_reacted` fields. Join feed_reactions for counts.

## 2. Database — Helper Functions

- [ ] 2.1 Create `toggle_feed_reaction(p_event_type text, p_source_id uuid)` RPC — inserts or deletes reaction, returns new state
- [ ] 2.2 Create `update_feed_last_seen()` RPC — updates feed_last_seen_at to now() for auth.uid()
- [ ] 2.3 Create `has_new_feed_events(p_user_id uuid)` RPC — returns boolean comparing feed_last_seen_at against latest event from followed users

## 3. Web — Enhanced Feed Cards

- [ ] 3.1 Update `activity-feed.tsx` to handle `rated` and `shared` event types — show star icons for ratings, "shared" verb for shares
- [ ] 3.2 Add client-side event deduplication — merge same user + same recipe events within 5-minute window into combined cards
- [ ] 3.3 Add reaction button to each feed card — fire/thumbs-up icon with count, toggle on click, optimistic update
- [ ] 3.4 Add unread dot indicator on "Home" nav link — check `has_new_feed_events` on mount, clear on feed view

## 4. Mobile — Enhanced Feed Cards

- [ ] 4.1 Update home tab feed to handle `rated` and `shared` event types — star icons for ratings, "shared" verb
- [ ] 4.2 Add client-side event deduplication matching web logic
- [ ] 4.3 Add reaction button to each feed card — haptic feedback on tap, optimistic update, highlighted state
- [ ] 4.4 Add unread dot on Home tab icon — check `has_new_feed_events`, clear when feed loads
- [ ] 4.5 Call `update_feed_last_seen` when home tab is focused and feed is loaded

## 5. TypeScript Types

- [ ] 5.1 Update `database.ts` with feed_reactions table types and new RPC function signatures
