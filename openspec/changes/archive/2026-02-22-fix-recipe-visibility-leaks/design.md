## Context

The `get_chef_profile` RPC is `SECURITY DEFINER` (bypasses RLS) and returns tab data for profile pages. The Activity and Favorites tabs query `cook_log` and `recipe_favorites` joined to `recipes` but don't filter by `visibility`. This means viewers see entries for private recipes they can't access — clicking them leads to a 404.

The activity feed view was already fixed (migration 000025) to filter cook and publish events to `visibility = 'public'`. Fork events were removed entirely. So the feed itself is clean.

## Goals / Non-Goals

**Goals:**
- Fix `get_chef_profile` Activity tab: only show entries for public recipes (or recipes the viewer owns)
- Fix `get_chef_profile` Favorites tab: same filter
- Show "This recipe is private" on recipe detail pages when RLS blocks access (instead of generic 404)

**Non-Goals:**
- Changing the activity feed view (already fixed)
- Adding new visibility levels
- Changing RLS policies

## Decisions

### 1. Visibility filter in get_chef_profile RPC

**Decision:** Add `AND (r.visibility = 'public' OR r.created_by = v_caller_id)` to the Activity and Favorites subqueries.

**Why this filter:** A viewer should see entries for recipes that are either public (anyone can see) or their own (the viewer made a recipe and it shows up when someone cooked/favorited it). This covers the case where you favorited your own private recipe — it still shows on your profile when you view it yourself.

### 2. "This recipe is private" vs generic 404

**Decision:** On both web and mobile recipe detail pages, when the query returns no result, use the admin client to check if the recipe ID exists at all. If it exists but RLS blocked it, show "This recipe is private." If it truly doesn't exist, show "Recipe not found."

**Why not just always show "private"?** That would leak information about whether a recipe ID exists. But since we're an invite-only platform with trusted users, the privacy leak is negligible, and the UX improvement is significant. However, checking existence via admin client is cleaner.

**Alternative considered:** Just show "Recipe not found" for everything. Simpler but confusing when you just clicked a link that implied the recipe exists.
