## 1. Database Migration

- [x] 1.1 Create migration: drop `recipe_share_cards` view, drop `recipe_shares` table
- [x] 1.2 Create migration: replace `activity_feed_view` with 3-way UNION (created, cooked with LEFT JOIN rating, favorited) — remove saved and rated event types
- [x] 1.3 Create migration: replace `get_activity_feed` RPC — remove share-related columns, ensure rating comes from cooked LEFT JOIN
- [x] 1.4 Create migration: replace `get_chef_profile` RPC — remove `v_recommendations` query and `recommendations` key from result
- [ ] 1.5 Verify migrations run cleanly against local Supabase (`supabase db reset`)

## 2. Web — Remove Recommendation UI

- [x] 2.1 Delete `src/app/(authenticated)/recipes/[id]/recommended-badge.tsx`
- [x] 2.2 Delete `src/app/(authenticated)/components/recommendation-card.tsx`
- [x] 2.3 Update `recipe-detail.tsx`: remove `RecommendedBadge` import and usage, remove `isShared` prop
- [x] 2.4 Update `recipes/[id]/page.tsx`: remove `recipe_shares` query and `shareData` variable
- [x] 2.5 Update `recipes/[id]/actions.ts`: remove `addRecommendation`, `removeRecommendation`, `saveRecommendation` functions
- [x] 2.6 Update `profile-tabs.tsx`: remove "Recs" tab, `RecommendationItem` interface, `recommendations` prop, and tab content
- [x] 2.7 Update `profile/[id]/page.tsx`: stop passing `recommendations` data to ProfileTabs

## 3. Web — Update Activity Feed

- [x] 3.1 Update `activity-feed.tsx`: remove `actionVerb` cases for "saved" and "rated"
- [x] 3.2 Update `activity-feed.tsx`: add "favorited" verb to `actionVerb` function
- [x] 3.3 Update `activity-feed.tsx`: show inline star rating on "cooked" events when `rating` is present
- [x] 3.4 Update `activity-feed.tsx`: show source attribution ("via {source}") on cooked events when `source_name` or `source_url` is present
- [x] 3.5 Update `activity-feed.tsx`: remove external link logic for "saved" events — all feed items link to recipe detail

## 4. Mobile — Remove Recommendation UI

- [x] 4.1 Delete `mobile/components/ui/RecommendationCard.tsx`
- [x] 4.2 Remove any RecommendationCard imports/usage in mobile screens
- [x] 4.3 Update mobile profile screen: remove "Recs" tab if present

## 5. Mobile — Update Activity Feed

- [x] 5.1 Update mobile home tab: remove `actionVerb` cases for "saved" and "rated"
- [x] 5.2 Update mobile home tab: add "favorited" verb
- [x] 5.3 Update mobile home tab: show inline star rating on "cooked" events
- [x] 5.4 Update mobile home tab: remove external link navigation for "saved" events — all items navigate to recipe detail

## 6. Save Button on Discover

- [x] 6.1 Add Save button to web discover recipe cards (reuse existing `SaveButton` or inline equivalent)
- [x] 6.2 Add Save button to mobile discover recipe cards
- [x] 6.3 Pass saved recipe IDs to discover page so cards show correct initial state

## 7. Verify

- [x] 7.1 Verify activity feed shows cooked events with inline ratings (web + mobile)
- [x] 7.2 Verify activity feed shows favorited events (web + mobile)
- [x] 7.3 Verify no "saved" or "rated" events appear in feed
- [x] 7.4 Verify profile pages have 3 tabs (Recipes, Activity, Favorites) — no Recs tab
- [x] 7.5 Verify Save button works on discover cards (web + mobile)
- [x] 7.6 Verify recipe detail page no longer shows Recommend badge for imported recipes
- [x] 7.7 Run platform-sync agent to confirm web/mobile parity
