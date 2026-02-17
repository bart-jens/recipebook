## 1. Database Migration — Fork Removal + Feed Update

- [x] 1.1 Create migration to drop `fork_recipe()` RPC function
- [x] 1.2 In same migration, replace `activity_feed_view` to remove the 'forked' UNION (keep only cooked + published)
- [x] 1.3 In same migration, replace `get_activity_feed()` function (same signature, no logic changes needed — it reads from the view)

## 2. Database Migration — Chef Profile RPC

- [x] 2.1 Create `get_chef_profile(p_chef_id uuid)` RPC function that returns profile info, stats, and tab data (activity from cook_log, favorites from recipe_favorites + recipes, published recipes, recommendations from recipe_share_cards) with follower-gated access for private profiles

## 3. Web — Strip Fork UI

- [x] 3.1 Remove `fork-button.tsx` component from `src/app/(authenticated)/recipes/[id]/`
- [x] 3.2 Remove `forkRecipe` server action from `src/app/(authenticated)/recipes/[id]/actions.ts`
- [x] 3.3 Remove fork attribution display ("Forked from X by Y") from `recipe-detail.tsx`
- [x] 3.4 Remove fork button rendering from `recipe-detail.tsx`
- [x] 3.5 Remove `forked_from_id` data fetching (original recipe + creator lookups) from `recipe-detail.tsx`
- [x] 3.6 Remove fork count display and fork count query from `src/app/(authenticated)/discover/page.tsx`
- [x] 3.7 Remove "Most Forked" sort option from discover page controls
- [x] 3.8 Remove `fork_recipe` RPC type from `src/types/database.ts`

## 4. Mobile — Strip Fork UI

- [x] 4.1 Remove `forkRecipe` function from `mobile/app/recipe/[id]/index.tsx`
- [x] 4.2 Remove fork button rendering from recipe detail screen
- [x] 4.3 Remove fork attribution display from recipe detail screen
- [x] 4.4 Remove `forked_from_id` data fetching from recipe detail screen
- [x] 4.5 Remove fork count display and fork count query from `mobile/app/(tabs)/discover.tsx`
- [x] 4.6 Remove "Most Forked" sort option from discover sort options
- [x] 4.7 Remove fork count from `mobile/components/ui/RecipeCard.tsx`

## 5. Web — Rename "Friends" to "Chefs" + Home Simplification

- [x] 5.1 Update activity feed header from "Friends are cooking" to "Your Chefs" in `src/app/(authenticated)/home/page.tsx`
- [x] 5.2 Update empty state text: "Follow friends..." → "Find Chefs to follow" with subtitle and "Discover Chefs" CTA button
- [x] 5.3 Update no-activity empty state: "Your friends haven't..." → "Your Chefs haven't been cooking lately"
- [x] 5.4 Remove trending recipes section from home page
- [x] 5.5 Remove recommendation cards section from home page
- [x] 5.6 Remove 'forked' event type handling from `activity-feed.tsx` component

## 6. Mobile — Rename "Friends" to "Chefs" + Home Simplification

- [x] 6.1 Update activity feed header to "Your Chefs" in `mobile/app/(tabs)/index.tsx`
- [x] 6.2 Update empty state: "Find Chefs to follow" with subtitle and "Discover Chefs" CTA button
- [x] 6.3 Update no-activity empty state to reference "Chefs"
- [x] 6.4 Remove trending recipes section from home screen
- [x] 6.5 Remove recommendation cards section from home screen
- [x] 6.6 Remove 'forked' event type handling from feed item rendering
- [x] 6.7 Remove `FeedItem` type's 'forked' from event_type union

## 7. Web — Chefs Tab on Discover

- [x] 7.1 Add segmented control (Recipes | Chefs) to discover page
- [x] 7.2 Create Chef card component: avatar, display name, recipe count, last cooked, inline follow button
- [x] 7.3 Implement Chefs tab data fetching: query user_profiles with aggregated cook_log data, exclude self and already-followed, sort by last activity
- [x] 7.4 Implement inline follow/unfollow actions on Chef cards
- [x] 7.5 Add "Invite a Chef" CTA section at bottom of Chefs list
- [x] 7.6 Add empty state for when all Chefs are followed
- [x] 7.7 Support deep link parameter to pre-select Chefs tab (for Home empty state CTA)

## 8. Mobile — Chefs Tab on Discover

- [x] 8.1 Add segmented control (Recipes | Chefs) to discover screen
- [x] 8.2 Create Chef card component matching web design
- [x] 8.3 Implement Chefs tab data fetching (same query logic as web)
- [x] 8.4 Implement inline follow/unfollow with haptic feedback
- [x] 8.5 Add "Invite a Chef" CTA section
- [x] 8.6 Add empty state for when all Chefs are followed
- [x] 8.7 Support navigation parameter to pre-select Chefs tab

## 9. Web — Chef Profile Tabs

- [x] 9.1 Refactor `src/app/(authenticated)/profile/[id]/page.tsx` to use `get_chef_profile` RPC instead of multiple queries
- [x] 9.2 Add horizontal tab bar component (Activity | Favorites | Published | Recommendations)
- [x] 9.3 Implement Activity tab: cook_log entries with recipe title, date, notes
- [x] 9.4 Implement Favorites tab: favorited recipes with ratings
- [x] 9.5 Migrate existing Published section into Published tab
- [x] 9.6 Migrate existing Recommendations section into Recommendations tab
- [x] 9.7 Add empty states for each tab ("No cooking activity yet", etc.)

## 10. Mobile — Chef Profile Tabs

- [x] 10.1 Refactor `mobile/app/profile/[id].tsx` to use `get_chef_profile` RPC
- [x] 10.2 Add horizontal tab bar component matching web design
- [x] 10.3 Implement Activity tab
- [x] 10.4 Implement Favorites tab
- [x] 10.5 Migrate existing Published section into Published tab
- [x] 10.6 Migrate existing Recommendations section into Recommendations tab
- [x] 10.7 Add empty states for each tab

## 11. Platform Parity Review

- [x] 11.1 Run platform-sync agent to verify web and mobile are in parity
- [x] 11.2 Run ui-reviewer agent on all changed screens
- [x] 11.3 Verify all "friends" / "fork" language is fully removed from both platforms
