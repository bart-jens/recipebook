## Context

EefEats has a fully built fork system (RPC, UI on both platforms, fork counts, activity feed events) that adds complexity without solving a need that saves + cook logs don't already cover. Meanwhile, user discovery is weak — there's no way to browse people, only recipes. The home screen mixes personal content with public trending, muddying its purpose.

Current state:
- `fork_recipe()` RPC, fork button, fork attribution, fork counts, "Most Forked" sort, fork events in activity feed — all fully implemented on web + mobile
- `activity_feed_view` UNIONs three event types: cooked, published, forked
- Home screen has: greeting, recent recipes, activity feed, recommendation cards, trending recipes
- Discover page shows only recipes with search/filter/sort
- Public profiles show: avatar, name, bio, stats, public recipes, recommendation cards
- RLS on `cook_log` and `recipe_favorites` restricts SELECT to owner only (plus public recipe cook logs)
- All "social" language uses "friends"

## Goals / Non-Goals

**Goals:**
- Strip all fork functionality from UI and backend code (keep schema columns for data safety)
- Rename "friends" → "Chefs" as the platform's social language
- Add a Chefs tab to Discover for browsing and following users
- Enrich Chef profiles with tabbed sections showing cooking activity and favorites
- Clarify the Home vs Discover boundary: Home = personal/social, Discover = exploration
- Improve empty states to guide new users toward following Chefs

**Non-Goals:**
- Destructive schema migration (dropping `forked_from_id` column, removing `source_type = 'fork'`)
- Search/filter on the Chefs tab (with <10 users, just list everyone)
- Algorithmic Chef recommendations or ranking
- Making saved recipes visible to followers (deferred)
- Comments system
- Notifications for new followers

## Decisions

### 1. Fork stripping: code removal, no schema destruction

**Decision:** Remove all fork-related application code (RPC, UI, queries) but keep the `forked_from_id` column and `source_type = 'fork'` enum value in the database.

**Why:** Destructive migrations are irreversible and the column costs nothing to keep. If any existing recipes have `forked_from_id` set, the data stays intact. The migration drops the `fork_recipe()` function and updates the `activity_feed_view` to remove the fork UNION.

**Alternative considered:** Full schema cleanup (drop column, remove enum value). Rejected because it's higher risk for zero user-facing benefit and complicates rollback.

### 2. Activity feed view: replace, don't alter

**Decision:** `CREATE OR REPLACE VIEW activity_feed_view` with only two UNIONs (cooked + published). Also `CREATE OR REPLACE FUNCTION get_activity_feed` with same signature. This is a single migration file.

**Why:** Views and functions are fully replaceable — no data loss, clean deployment. The `get_activity_feed` RPC signature stays the same (returns same columns), so no client-side type changes needed beyond removing fork event handling in the UI.

### 3. Chefs tab: toggle within existing Discover page

**Decision:** Add a segmented control (`Recipes | Chefs`) at the top of the Discover page. Default to Recipes (current behavior). Chefs tab shows a list of all users (excluding self) with inline follow buttons.

**Why over a separate tab in bottom nav:** Bottom nav real estate is precious on mobile. A toggle within Discover is lower-friction to build, avoids nav restructuring, and semantically makes sense — "discover recipes" and "discover chefs" are the same intent.

**Chef card data:**
- Avatar, display name
- Recipe count (count of user's recipes, any visibility — shows they're active)
- Last cooked date (most recent `cook_log.cooked_at` — shows recency)
- Follow state + inline button (Follow / Following / Requested)

**Sorting:** Most recently active first (last cook_log entry). Users who've never logged a cook sort to the bottom.

**Query approach:** Single query joining `user_profiles` with aggregated `cook_log` data. No RPC needed — straightforward Supabase client query with RLS.

### 4. Chef profiles: tabbed sections with follower gating

**Decision:** Replace the current flat profile layout with horizontal tabs: `Activity | Favorites | Published | Recommendations`. The tab content is only visible to followers (or the profile owner). Non-followers of private profiles see the "This account is private" gate as today.

**Tab content:**

| Tab | Data source | What it shows |
|-----|-------------|---------------|
| Activity | `cook_log` | Recent cooks with recipe title, date, notes |
| Favorites | `recipe_favorites` + `recipes` | Favorited recipes with rating |
| Published | `recipes` where `visibility = 'public'` | Same as current public recipes section |
| Recommendations | `recipe_share_cards` view | Same as current recommendations section |

**Why tabs over long scroll:** With 4 sections, scrolling becomes unwieldy. Tabs let users jump to what they care about. Also cleaner on mobile — each tab can have its own scroll.

### 5. Follower-visible data: RPC function

**Decision:** Create a `get_chef_profile(p_chef_id uuid)` RPC function that returns profile data + tab contents in one call. The function checks follow status server-side and returns appropriate data.

**Why RPC over RLS policy changes:**
- Current RLS on `cook_log` and `recipe_favorites` is clean and restrictive — adding follower-based SELECT policies means complex JOINs in every policy check against `user_follows`
- An RPC can do one follow check and return all data in a single round-trip
- Keeps RLS simple (owner-only) and moves the follower visibility logic to application level
- Returns everything the profile needs in one call (profile info, stats, tab data) — better performance

**Alternative considered:** Adding `"Followers can view cook_log"` and `"Followers can view recipe_favorites"` RLS policies. Rejected because it adds cross-table JOIN complexity to policies that currently have clean single-table checks, and we'd still need multiple queries client-side.

### 6. Home screen simplification

**Decision:** Remove two sections from Home:
1. **Trending recipes** — redundant with Discover. Home should be personal + social only.
2. **Recommendation cards** — move to Chef profiles (Recommendations tab). Keeps Home focused.

**Remaining Home sections:**
1. Greeting
2. Your Recipes (recent carousel)
3. Your Chefs (activity feed with improved empty states)

**Empty state for "Your Chefs" when not following anyone:**
- Title: "Find Chefs to follow"
- Subtitle: "See what other Chefs are cooking and get inspired"
- CTA button: "Discover Chefs" → navigates to Discover page with Chefs tab pre-selected

### 7. "Chef" language — scope and placement

**Decision:** "Chef" replaces "friend" in all social contexts. It does NOT replace "user" in technical/auth contexts.

| Context | Language |
|---------|----------|
| Activity feed header | "Your Chefs" |
| Empty states | "Follow Chefs to see..." |
| Discover tab | "Chefs" |
| Profile stats | Keep "followers" / "following" (universal, no change needed) |
| Invite flow | "Invite a Chef" |
| Internal code | Keep `user_profiles`, `user_follows` etc. (no rename) |

**Why not rename DB tables/columns:** "Chef" is a UI/branding choice, not a data model change. DB stays generic (`user_*`), UI says "Chef".

## Risks / Trade-offs

**Fork data orphaning** → No mitigation needed. Existing forked recipes still work as normal recipes. They just lose their fork button and attribution display. The `forked_from_id` column stays populated but unused.

**Activity feed shrinks** → With fork events removed, the feed has fewer event types (cooked + published only). At low user counts this makes the feed feel emptier. Mitigation: this is temporary — future event types (comments, saves) will fill it back out. The cook log is the primary social signal anyway.

**Chef profiles add load** → The `get_chef_profile` RPC returns more data than the current profile query. Mitigation: paginate tab contents (e.g., 20 most recent cooks), lazy-load tabs on selection.

**Discover page complexity** → Adding a toggle adds state. Mitigation: simple boolean state (`showChefs`), each tab is its own component with independent data loading. No shared state between tabs.

**"Chef" terminology might not land** → Users might find "Chef" pretentious if they're just saving recipes. Mitigation: everyone is a Chef by default (inclusive, not earned). The word is used lightly — "Follow Chefs" feels natural in a cooking app. Easy to rename later since it's UI-only.
