## Context

The app currently has four "I like this" signals: rate, favorite, recommend, save. "Recommend" (`recipe_shares`) was designed as an IP-safe way to share imported recipes, but it duplicates what cook logs with ratings already communicate. The "rated" and "cooked" events appear as separate feed items for what is really one action. The `saved_recipes` table has full RLS but the Save button only appears on recipe detail pages for non-owners — it's already wired up but not prominent. Favorites generate no social signal despite being the strongest endorsement ("this is a go-to").

### Current feed event types
- `created` — user published a manual recipe
- `saved` — user recommended an imported recipe (via `recipe_shares`)
- `cooked` — user logged cooking a recipe
- `rated` — user rated a recipe (separate event from cooking)

### Key existing components
- **Web**: `ActivityFeed`, `RecommendedBadge`, `RecommendationCard`, `SaveButton`, `FavoriteButton`, `ProfileTabs` (4 tabs: Recipes, Activity, Favorites, Recs)
- **Mobile**: Activity ticker in home tab, `RecommendationCard`
- **DB**: `activity_feed_view` (4-way UNION), `get_activity_feed` RPC, `get_chef_profile` RPC (returns recommendations), `recipe_shares` table, `recipe_share_cards` view

## Goals / Non-Goals

**Goals:**
- Reduce social signals from 4 to 3: cook+rate (merged), favorite, save
- Make cook log events richer — inline rating, source attribution, notes — so they serve as natural recommendations
- Add "favorited" as a lightweight feed event
- Remove all recommendation/share infrastructure cleanly
- Keep existing Save button working, ensure it's visible on discover cards too

**Non-Goals:**
- Redesigning the activity feed layout or visual style
- Adding new social features (comments, reactions)
- Changing how cook logs, ratings, or favorites are created
- Modifying the `saved_recipes` table structure or RLS (already correct)
- Mobile profile tabs for other users (separate parity work)

## Decisions

### 1. Activity feed view — new shape

Replace the 4-way UNION with a 3-way UNION:

```
activity_feed_view:
  created  — manual public recipes (unchanged)
  cooked   — cook_log + LEFT JOIN recipe_ratings for inline rating
             + source_url, source_name from recipes
  favorited — recipe_favorites for public recipes (NEW)

REMOVED: saved (recipe_shares), rated (separate event)
```

**Why merge rated into cooked?** Rating requires cooking first (cook gate). If you cook and rate in the same session, that's one action from the user's perspective. Showing two feed items is noise. The rating is most meaningful when shown alongside the cook event.

**Why LEFT JOIN ratings?** Not every cook has a rating. We want to show the rating when available but still show cook events without one.

**Deduplication concern:** A user might cook the same recipe multiple times. Each cook is a separate event (that's intentional — "Bart cooked Miso Ramen again"). The rating shown is always their current/latest rating (single row in recipe_ratings per user+recipe).

### 2. Enriched cook events in `get_activity_feed` RPC

The RPC already returns `source_url`, `source_name`, and `rating`. After this change:
- `rating` comes from the LEFT JOIN on cooked events (was only on rated events before)
- `source_url` and `source_name` are already joined from recipes — no change needed

The frontend will render cook events with:
- Rating stars inline (when present)
- Source attribution "via seriouseats.com" (when present, for imported recipes someone cooked)
- Cook notes (already shown)

### 3. Favorited feed events

Add to `activity_feed_view`:
```sql
SELECT 'favorited'::text AS event_type,
       rf.user_id, rf.recipe_id,
       rf.created_at AS event_at,
       NULL::text AS notes,
       NULL::integer AS rating
FROM recipe_favorites rf
JOIN recipes r ON r.id = rf.recipe_id
WHERE r.visibility = 'public'
```

Frontend renders as: "{name} favorited {recipe}" — no stars, no notes. Simple signal.

**Why no cook gate check here?** The cook gate is already enforced on `recipe_favorites` insert. If a favorite exists, the user has cooked it.

### 4. Drop `recipe_shares` and `recipe_share_cards`

Single migration that:
1. Drops `recipe_share_cards` view first (depends on table)
2. Drops `recipe_shares` table
3. Replaces `activity_feed_view` (new 3-way UNION)
4. Replaces `get_activity_feed` RPC (remove share-related logic)
5. Replaces `get_chef_profile` RPC (remove recommendations section)

**Ordering matters:** View depends on table, RPC depends on view. Drop in correct order.

### 5. `get_chef_profile` RPC changes

Remove the `v_recommendations` query and output key. The RPC returns:
- `profile`, `stats`, `is_following`, `is_owner`, `can_view`
- `activity`, `favorites`, `published` (kept)
- ~~`recommendations`~~ (removed)

### 6. Save button — already exists, minor additions

The `SaveButton` component already works on web recipe detail pages for non-owners. The `saveRecipe`/`unsaveRecipe` server actions already use `saved_recipes`.

What's needed:
- Add Save button to discover recipe cards (web + mobile)
- Ensure mobile recipe detail has a Save button equivalent
- No table/RLS changes needed

### 7. Frontend cleanup

**Web — delete:**
- `src/app/(authenticated)/recipes/[id]/recommended-badge.tsx`
- `src/app/(authenticated)/components/recommendation-card.tsx`

**Web — update:**
- `recipe-detail.tsx`: Remove `RecommendedBadge` import and usage, remove `isShared` prop
- `page.tsx` (recipe detail): Remove `recipe_shares` query and `shareData`
- `profile-tabs.tsx`: Remove "Recs" tab and `RecommendationItem` interface, remove `recommendations` prop
- `profile/[id]/page.tsx`: Stop passing recommendations data
- `activity-feed.tsx`: Remove "saved" and "rated" handling, add "favorited" verb, show rating inline on "cooked" events, show source attribution on cooked events
- `actions.ts` (recipe detail): Remove `addRecommendation`, `removeRecommendation`, `saveRecommendation`

**Mobile — delete:**
- `mobile/components/ui/RecommendationCard.tsx`

**Mobile — update:**
- Home tab activity ticker: Remove "saved"/"rated" handling, add "favorited", show rating on cooked
- Profile screen: Remove recommendations tab if present

## Risks / Trade-offs

**[Data loss] Existing recipe_shares rows will be deleted** → This is intentional. The recommendation data was metadata-only (title, source link) — no unique content is lost. Users' actual recipes remain in the recipes table. Inform users? Not needed for invite-only audience.

**[Feed gap] Users who only "recommended" but never cooked will lose that feed presence** → Acceptable. The recommendation system wasn't heavily used, and cook logs are the real signal.

**[Migration ordering] Views depend on tables** → Drop view before table. RPC replacement handles this cleanly since CREATE OR REPLACE rebuilds the function.

**[Dedup edge case] Cook + Favorite in same session = two feed events** → Acceptable. "Bart cooked Miso Ramen" and "Bart favorited Miso Ramen" are distinct signals with different meaning. The favorited event is lightweight (no notes/rating) so it doesn't feel repetitive.
