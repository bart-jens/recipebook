## Why

The fork feature adds complexity without solving a real user need — saves, cook logs, and (future) comments cover the same ground more naturally. Meanwhile, the social graph has no discoverability: there's no way to browse people, and "friends" language feels generic. Renaming to "Chefs" and adding a dedicated discovery surface makes following people the core social action, which is what drives the activity feed that makes the app feel alive.

## What Changes

### Removals (fork stripping)
- **BREAKING**: Remove `fork_recipe()` RPC function
- **BREAKING**: Remove fork button from recipe detail (web + mobile)
- **BREAKING**: Remove fork attribution display from recipe detail (web + mobile)
- **BREAKING**: Remove fork count display from recipe cards and discover page (web + mobile)
- **BREAKING**: Remove "Most Forked" sort option from discover (web + mobile)
- Remove 'forked' event type from activity feed view and feed UI
- Remove `forked_from_id` lookups in recipe detail data fetching
- Remove fork-related analytics logging
- Keep `forked_from_id` column and `source_type = 'fork'` in schema (no destructive migration — existing data stays, code just stops using it)

### Additions (Chef discovery)
- Rename all "friends" language to "Chefs" across the app (web + mobile)
- Add **Chefs tab** to Discover page: browse all users with inline follow buttons
- Chef cards show: avatar, name, recipe count, last active ("last cooked X ago")
- "Invite a Chef" CTA at bottom of Chefs tab
- Enrich **Chef profile** with tabbed sections: Activity, Favorites, Published, Recommendations (visible to followers)
- Add RLS policies or RPC to expose cook_log and recipe_favorites to followers

### Modifications (Home screen)
- Remove trending recipes section from Home (that's Discover's job)
- Rename activity feed header from "Friends are cooking" to "Your Chefs"
- Improve empty state: when following nobody, show "Discover Chefs" CTA that links to Discover > Chefs tab
- Remove recommendation cards section from Home (simplify — recommendations live on Chef profiles)

## Capabilities

### New Capabilities
- `chef-discovery`: Chefs tab on Discover page — browsing users, Chef cards with inline follow, "Invite a Chef" CTA, sorting by activity
- `chef-profiles`: Enhanced Chef profile with tabbed sections (Activity, Favorites, Published, Recommendations) visible to followers, with follower-scoped data access

### Modified Capabilities
- `social-platform`: Remove fork references from discovery requirements (fork count, "Most Forked" sort), rename "friends" to "Chefs" in feed headers and empty states, remove trending section from Home
- `activity-feed`: Remove 'forked' event type from feed view and UI, rename "Friends are cooking" to "Your Chefs", update empty states to reference Chefs
- `recipe-forking`: **Deprecate entire capability** — all requirements become void, spec archived
- `user-profiles`: Add follower-visible sections (cook log, favorites) to public profile page, add tabbed profile layout

## Impact

- **Database**: New migration to drop `fork_recipe()` RPC, update `activity_feed_view` to remove fork events, add RLS policies for follower-visible cook_log and recipe_favorites
- **Web (Next.js)**: Remove fork-button.tsx, update recipe-detail.tsx, update discover page (add Chefs tab, remove fork sort/count), update home page (remove trending, update empty states), update profile/[id] page (add tabs)
- **Mobile (React Native)**: Same changes as web — recipe detail, discover, home, profile screens
- **Types**: Update database.ts to remove fork_recipe RPC type
- **Specs**: Archive recipe-forking spec, update 4 existing specs, create 2 new specs
