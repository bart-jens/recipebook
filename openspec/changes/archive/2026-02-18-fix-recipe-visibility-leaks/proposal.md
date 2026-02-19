## Why

Social features (activity feed, profile tabs) leak references to private recipes that viewers can't access. Clicking these leads to a 404 or blank page. The root cause: several RPC functions and views use `SECURITY DEFINER` (bypasses RLS) but don't replicate the visibility filter. The principle should be: if you can't read it, don't show it.

## What Changes

- **Activity feed view** — Add `visibility = 'public'` filter to fork events (cook and publish events already filtered).
- **Profile Activity tab** (`get_chef_profile` RPC) — Filter cook_log entries to only include recipes where `visibility = 'public'` OR the recipe is owned by the viewer.
- **Profile Favorites tab** (`get_chef_profile` RPC) — Same filter: only show favorites for public recipes or recipes the viewer owns.
- **Recipe detail 404** — When a recipe isn't found (RLS blocked), show "This recipe is private" instead of a generic 404 (web + mobile).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `activity-feed`: Fix fork events to filter by recipe visibility
- `chef-profiles`: Fix Activity and Favorites tabs to filter by recipe visibility

## Impact

**Database:** Update `activity_feed_view` (add visibility filter to fork events). Update `get_chef_profile` RPC (add visibility filter to activity and favorites queries).
**Web:** Update recipe detail 404 page to show "This recipe is private" message.
**Mobile:** Update recipe detail "not found" state to show "This recipe is private" message.
