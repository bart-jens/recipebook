## Why

The app has four separate "I like this" signals (rate, favorite, recommend, save) which is confusing for users and creates redundant feed events. "Recommend" (recipe_shares) duplicates what cook logs with ratings already communicate naturally — if you cooked something and gave it 5 stars, that IS a recommendation. Meanwhile, `saved_recipes` has a table with zero UI, "cooked" and "rated" create two separate feed events for the same action, and favorites are socially invisible. Simplifying to three clear concepts (cook+rate, favorite, save) removes confusion and makes the feed more meaningful.

## What Changes

- **BREAKING**: Remove the entire "Recommend" system — `recipe_shares` table, `recipe_share_cards` view, `RecommendedBadge` component, `RecommendationCard` component (web + mobile), profile "Recs" tab, and the "saved" event type from the activity feed
- **BREAKING**: Merge "rated" and "cooked" into a single feed event — "cooked" events now include the user's rating inline (if they rated), so no more separate "rated" events cluttering the feed
- Enrich cook log feed events: show rating (stars), source attribution ("via seriouseats.com") for imported recipes, cook notes, and recipe image prominently — making every cook event a natural recommendation card
- Add "favorited" as a new feed event type — "Bart marked Miso Ramen as a favorite" is a lightweight social signal that surfaces go-to recipes
- Build Save UI: add a "Save" button on public recipe detail pages and discover cards, show saved recipes in the user's collection (the `saved_recipes` table already exists with RLS, just needs UI)

## Capabilities

### New Capabilities
_(none — all changes modify existing capabilities)_

### Modified Capabilities
- `activity-feed`: Remove "saved" (recommendation) and "rated" event types; add "favorited" event type; merge rating data into "cooked" events; enrich cook events with source attribution
- `recipe-sharing`: **Remove entirely** — the recommendation system (recipe_shares, share cards, recommendation card UI, share flow) is being deleted. The photo upload limits requirement moves to `recipe-images` or stays orphaned for now.
- `recipe-interactions`: Add "Save" button UI on public recipe detail pages; update favorite behavior to generate a feed event; no changes to cook log, rating, or favorite table structures

## Impact

### Database
- Drop `recipe_shares` table (migration)
- Drop `recipe_share_cards` view (migration)
- Update `activity_feed_view` — remove "saved" source, remove "rated" source, add "favorited" source, add rating + source fields to "cooked" events
- Update `get_activity_feed` RPC if it references share data

### Web (`src/`)
- Delete: `recipes/[id]/recommended-badge.tsx`, `components/recommendation-card.tsx`
- Delete: `recipes/[id]/actions.ts` — `addRecommendation`, `removeRecommendation`, `saveRecommendation` functions
- Update: `recipes/[id]/page.tsx` — remove share status check, remove RecommendedBadge
- Update: `profile/[id]/profile-tabs.tsx` — remove "Recs" tab
- Update: `home/activity-feed.tsx` — update event rendering for enriched cook events, handle favorited events, remove saved/rated event handling
- Add: Save button on public recipe detail pages
- Add: Save button on discover recipe cards

### Mobile (`mobile/`)
- Delete: `components/ui/RecommendationCard.tsx`
- Update: activity feed rendering — same changes as web
- Update: profile tabs — remove "Recs" tab (if present)
- Add: Save button on public recipe detail + discover

### Specs
- `recipe-sharing` spec should be archived or marked deprecated
- `activity-feed` spec needs updated event type definitions
- `recipe-interactions` spec needs updated save/favorite requirements
