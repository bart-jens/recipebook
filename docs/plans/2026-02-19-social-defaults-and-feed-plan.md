# Social Defaults & Feed Alive — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Flip recipe visibility defaults to social-first (public originals, auto-recommend imports), enrich the activity feed with new event types, and redesign the Home tab as a social hub on both web and mobile.

**Architecture:** Database migration changes defaults and rewrites the activity feed view. Web and mobile both modify recipe creation flows to auto-publish/auto-share. The Publish button is replaced with a Public/Private toggle. Home tab gets redesigned with 3 sections: activity feed, "looking for something to cook?", and your recent activity.

**Tech Stack:** Supabase (PostgreSQL + RLS), Next.js 14 (App Router, Tailwind), React Native / Expo (Expo Router), TypeScript

**Design doc:** `docs/plans/2026-02-19-social-defaults-and-feed-design.md`

---

## Task 1: Database Migration — Defaults, Feed View, and RPC

**Files:**
- Create: `supabase/migrations/20240101000037_social_defaults_and_feed.sql`

This migration does 5 things:
1. Changes default visibility for manual recipes to `'public'`
2. Adds a trigger to auto-set `published_at` on insert for manual/fork public recipes
3. Drops the `enforce_publish_limit` trigger
4. Rewrites `activity_feed_view` with new event types (`created`, `saved`, `cooked`, `rated`)
5. Rewrites `get_activity_feed` RPC with additional return columns (`source_url`, `source_name`, `rating`)

**Step 1: Write the migration**

```sql
-- Social Defaults & Feed Alive
--
-- 1. Manual recipes default to public (with auto-set published_at)
-- 2. Drop free-tier publish limit
-- 3. Rewrite activity feed with new event types (created, saved, cooked, rated)
-- 4. Update get_activity_feed RPC with richer return data

-- =============================================================================
-- 1. Change default visibility for recipes to 'public'
-- =============================================================================
-- Note: The CHECK constraint imported_recipes_stay_private still prevents
-- imported recipes (url, instagram, photo) from being public. This default
-- only takes effect for source_type = 'manual' or 'fork' due to that constraint.

ALTER TABLE public.recipes ALTER COLUMN visibility SET DEFAULT 'public';

-- Auto-set published_at when a recipe is inserted as public
CREATE OR REPLACE FUNCTION public.auto_set_published_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.visibility = 'public' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_published_at_trigger
  BEFORE INSERT ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_published_at();

-- =============================================================================
-- 2. Drop the free-tier publish limit trigger
-- =============================================================================

DROP TRIGGER IF EXISTS enforce_publish_limit_trigger ON public.recipes;
DROP FUNCTION IF EXISTS public.enforce_publish_limit();

-- =============================================================================
-- 3. Rewrite activity_feed_view with new event types
-- =============================================================================
-- Event types:
--   created  = manual recipe auto-published (public recipes only)
--   saved    = imported recipe auto-recommended (ANY visibility — share card metadata only)
--   cooked   = cook log entry (public recipes only)
--   rated    = rating added (public recipes only)

CREATE OR REPLACE VIEW activity_feed_view AS

-- Created events: manual recipes that are public
SELECT
  'created'::text AS event_type,
  r.created_by AS user_id,
  r.id AS recipe_id,
  r.published_at AS event_at,
  NULL::text AS notes,
  NULL::integer AS rating
FROM recipes r
WHERE r.visibility = 'public'
  AND r.published_at IS NOT NULL
  AND r.source_type IN ('manual', 'fork')

UNION ALL

-- Saved events: recipe_shares (auto-recommendations for imports)
-- No visibility filter: imported recipes are private but share cards
-- only expose non-copyrightable metadata (title, source, image)
SELECT
  'saved'::text AS event_type,
  rs.user_id,
  rs.recipe_id,
  rs.shared_at AS event_at,
  rs.notes,
  NULL::integer AS rating
FROM recipe_shares rs

UNION ALL

-- Cook events: from cook_log, only for public recipes
SELECT
  'cooked'::text AS event_type,
  cl.user_id,
  cl.recipe_id,
  cl.cooked_at AS event_at,
  cl.notes,
  NULL::integer AS rating
FROM cook_log cl
JOIN recipes r ON r.id = cl.recipe_id
WHERE r.visibility = 'public'

UNION ALL

-- Rated events: from recipe_ratings, only for public recipes
SELECT
  'rated'::text AS event_type,
  rr.user_id,
  rr.recipe_id,
  rr.created_at AS event_at,
  rr.notes,
  rr.rating
FROM recipe_ratings rr
JOIN recipes r ON r.id = rr.recipe_id
WHERE r.visibility = 'public';

-- =============================================================================
-- 4. Rewrite get_activity_feed RPC with richer return data
-- =============================================================================
-- Added: source_url, source_name (for "View source" on saved events)
-- Added: rating (for rated events)
-- Added: event-appropriate source data

CREATE OR REPLACE FUNCTION get_activity_feed(
  p_user_id uuid,
  p_before timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  event_type text,
  user_id uuid,
  recipe_id uuid,
  event_at timestamptz,
  notes text,
  display_name text,
  avatar_url text,
  recipe_title text,
  recipe_image_url text,
  source_url text,
  source_name text,
  rating integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    af.event_type,
    af.user_id,
    af.recipe_id,
    af.event_at,
    af.notes,
    up.display_name,
    up.avatar_url,
    r.title AS recipe_title,
    r.image_url AS recipe_image_url,
    r.source_url,
    r.source_name,
    af.rating
  FROM activity_feed_view af
  JOIN user_follows uf ON uf.following_id = af.user_id AND uf.follower_id = p_user_id
  JOIN user_profiles up ON up.id = af.user_id
  JOIN recipes r ON r.id = af.recipe_id
  WHERE af.event_at < p_before
  ORDER BY af.event_at DESC
  LIMIT p_limit;
$$;

-- Ensure authenticated users can call it
GRANT EXECUTE ON FUNCTION get_activity_feed(uuid, timestamptz, int) TO authenticated;
```

**Step 2: Apply the migration locally**

Run: `npx supabase db push` (or `npx supabase migration up` depending on local setup)

Verify:
- `SELECT column_default FROM information_schema.columns WHERE table_name='recipes' AND column_name='visibility';` should return `'public'::text`
- `SELECT * FROM activity_feed_view LIMIT 5;` should return rows with event_type in ('created', 'saved', 'cooked', 'rated')
- The `enforce_publish_limit` trigger should no longer exist

**Step 3: Commit**

```bash
git add supabase/migrations/20240101000037_social_defaults_and_feed.sql
git commit -m "feat(db): social defaults — public recipes, enriched feed, drop publish limit"
```

---

## Task 2: Web — Auto-Share on Import + Auto-Publish on Create

**Files:**
- Modify: `src/app/(authenticated)/recipes/actions.ts` (the `createRecipe` server action)

**Step 1: Add auto-share for imported recipes**

After the recipe is inserted and ingredients/tags are saved, add a `recipe_shares` insert for non-manual recipes. Also set `visibility: 'public'` and `published_at` for manual recipes (the DB default handles this, but be explicit in the insert).

In `src/app/(authenticated)/recipes/actions.ts`, modify the `createRecipe` function:

After the image rehost block (around line 89), before the redirect, add:

```typescript
  // Auto-share imported recipes (creates recommendation card for followers)
  const sourceType = (formData.get("source_type") as string) || "manual";
  if (sourceType !== "manual") {
    await supabase.from("recipe_shares").insert({
      user_id: user.id,
      recipe_id: recipe.id,
    });
  }
```

The `visibility` and `published_at` defaults are handled by the DB migration (default `'public'` + trigger for `published_at`). The CHECK constraint `imported_recipes_stay_private` will keep imported recipes private even with the new default — the insert doesn't specify visibility, so imported recipes will fail the constraint if the default is 'public'.

**Important:** We need to explicitly set `visibility: 'private'` for imported recipes in the insert to avoid the CHECK constraint violation. Update the insert:

```typescript
  const sourceType = (formData.get("source_type") as string) || "manual";

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      title,
      description,
      instructions,
      prep_time_minutes: prepTime ? parseInt(prepTime) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      source_type: sourceType,
      source_url: (formData.get("source_url") as string) || null,
      source_name: sourceName,
      language,
      image_url: externalImageUrl,
      created_by: user.id,
      // Imported recipes must stay private (CHECK constraint).
      // Manual recipes use DB default ('public').
      ...(sourceType !== "manual" ? { visibility: "private" } : {}),
    })
    .select("id")
    .single();
```

**Step 2: Verify locally**

- Create a manual recipe on web → should be `visibility: 'public'` and `published_at` set
- Import a URL recipe on web → should be `visibility: 'private'` and have a `recipe_shares` entry

**Step 3: Commit**

```bash
git add src/app/(authenticated)/recipes/actions.ts
git commit -m "feat(web): auto-publish manual recipes, auto-share imports"
```

---

## Task 3: Mobile — Auto-Share on Import + Auto-Publish on Create

**Files:**
- Modify: `mobile/app/recipe/new.tsx` (manual recipe creation)
- Modify: `mobile/app/recipe/import-url.tsx` (URL/Instagram import)
- Modify: `mobile/app/recipe/import-photo.tsx` (photo import)

**Step 1: Update manual recipe creation**

In `mobile/app/recipe/new.tsx`, the insert currently sets `source_type: 'manual'`. The DB default now handles `visibility: 'public'` and the trigger sets `published_at`. No change needed for the insert itself — it will pick up the DB defaults.

Verify: the insert does NOT explicitly set `visibility: 'private'`. If it does, remove that.

**Step 2: Update URL import to set private + auto-share**

In `mobile/app/recipe/import-url.tsx`, in the `handleSave` function (around line 109), add `visibility: 'private'` to the insert (to avoid CHECK constraint violation with new default), and add auto-share after:

```typescript
const { data: recipe, error } = await supabase
  .from('recipes')
  .insert({
    title: data.title.trim(),
    description: data.description.trim() || null,
    instructions: data.instructions.trim() || null,
    prep_time_minutes: data.prep_time_minutes ? parseInt(data.prep_time_minutes) : null,
    cook_time_minutes: data.cook_time_minutes ? parseInt(data.cook_time_minutes) : null,
    servings: data.servings ? parseInt(data.servings) : null,
    source_type: sourceType,
    source_url: url.trim(),
    source_name: extractedSourceName,
    language: extractedLanguage,
    image_url: extractedImageUrl,
    created_by: user.id,
    visibility: 'private', // CHECK constraint: imported recipes must stay private
  })
  .select('id')
  .single();
```

Then after ingredients/tags are saved, add:

```typescript
// Auto-share imported recipe (recommendation card for followers)
await supabase.from('recipe_shares').insert({
  user_id: user.id,
  recipe_id: recipe.id,
});
```

**Step 3: Update photo import the same way**

In `mobile/app/recipe/import-photo.tsx`, same pattern: add `visibility: 'private'` to insert, add auto-share after save.

**Step 4: Verify locally**

- Create a manual recipe on mobile → `visibility: 'public'`, `published_at` set
- Import a URL on mobile → `visibility: 'private'`, `recipe_shares` entry exists

**Step 5: Commit**

```bash
git add mobile/app/recipe/new.tsx mobile/app/recipe/import-url.tsx mobile/app/recipe/import-photo.tsx
git commit -m "feat(mobile): auto-publish manual recipes, auto-share imports"
```

---

## Task 4: Web — Replace Publish Button with Public/Private Toggle

**Files:**
- Modify: `src/app/(authenticated)/recipes/[id]/recipe-detail.tsx` (swap PublishButton for toggle)
- Modify: `src/app/(authenticated)/recipes/[id]/actions.ts` (simplify publish/unpublish to toggle)
- Delete: `src/app/(authenticated)/recipes/[id]/publish-button.tsx` (no longer needed)
- Modify: `src/app/(authenticated)/recipes/[id]/share-button.tsx` (change to "Recommended" badge with remove option)
- Modify: `src/app/(authenticated)/recipes/[id]/page.tsx` (remove publishCount/userPlan data fetching)

**Step 1: Create a VisibilityToggle component**

Replace the publish-button.tsx file with a new inline toggle in recipe-detail.tsx. The toggle is a simple button that flips between Public and Private.

In `recipe-detail.tsx`, replace the PublishButton/ShareButton conditional block (lines 187-199) with:

```tsx
{recipe.source_type === "manual" && !recipe.forked_from_id ? (
  <VisibilityToggle recipeId={recipe.id} isPublic={recipe.visibility === "public"} />
) : (
  <RecommendedBadge recipeId={recipe.id} isShared={isShared ?? false} />
)}
```

Create a new `visibility-toggle.tsx` component:
- A small button/toggle: shows "Public" (green) or "Private" (gray) with a lock icon
- Clicking toggles visibility via server action (no modal, no confirmation)
- Server action: `toggleVisibility(recipeId, newVisibility)` → updates `visibility` and `published_at`

For imported recipes, show a "Recommended" badge instead:
- Small badge showing "Recommended to followers"
- Small "x" or "Remove" link to delete the `recipe_shares` entry
- If not recommended, show nothing (or "Recommend" button to re-add)

**Step 2: Simplify server actions**

In `actions.ts`, the `publishRecipe`/`unpublishRecipe` actions become a single `toggleVisibility`:

```typescript
export async function toggleVisibility(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: recipe } = await supabase
    .from("recipes")
    .select("visibility")
    .eq("id", recipeId)
    .eq("created_by", user.id)
    .single();

  if (!recipe) return { error: "Recipe not found" };

  const newVisibility = recipe.visibility === "public" ? "private" : "public";
  const updates: Record<string, unknown> = { visibility: newVisibility };
  if (newVisibility === "public") {
    updates.published_at = new Date().toISOString();
  }

  await supabase.from("recipes").update(updates).eq("id", recipeId);
  revalidatePath(`/recipes/${recipeId}`);
}
```

Add `removeRecommendation` and `addRecommendation` actions for imported recipes.

**Step 3: Remove publishCount/userPlan fetching from page.tsx**

In `page.tsx`, remove the queries for `publishCount` and `userPlan` that were used by the old PublishButton.

**Step 4: Update recipe cards with lock icon for private**

In recipe list/card components, add a small lock icon next to private recipes. Public recipes get no icon (public is the norm).

**Step 5: Verify locally**

- View a manual recipe → see Public/Private toggle instead of Publish button
- Toggle works: switches visibility without modal
- View an imported recipe → see "Recommended to followers" badge
- Can remove recommendation
- No publish limit messaging anywhere

**Step 6: Commit**

```bash
git add src/app/(authenticated)/recipes/[id]/
git commit -m "feat(web): replace Publish button with Public/Private toggle"
```

---

## Task 5: Mobile — Replace Publish Button with Public/Private Toggle

**Files:**
- Modify: `mobile/app/recipe/[id]/index.tsx` (replace publish/share buttons with toggle + badge)

**Step 1: Replace the publish button section**

In `mobile/app/recipe/[id]/index.tsx`, find the publish/unpublish toggle block (around line 837). Replace with:

For manual recipes:
- A `TouchableOpacity` styled as a toggle pill: "Public" (primary color) / "Private" (muted)
- Tapping flips visibility via supabase update (no Alert, no confirmation)
- Lock icon for private state

For imported recipes:
- A muted badge: "Recommended to followers"
- Small "Remove" text button to delete the `recipe_shares` entry
- If removed, show "Recommend" button to re-add

**Step 2: Remove publish limit UI**

Remove all references to `publishCount`, `publishLimit`, `atPublishLimit`, and the limit indicator text.

**Step 3: Remove the share modal flow**

The old share modal (with notes textarea) is no longer needed for the auto-share flow. The `shareNotes` state and `toggleShare` function can be simplified.

**Step 4: Verify locally**

- Manual recipe → Public/Private toggle, no publish limit
- Imported recipe → "Recommended to followers" badge
- Toggle works smoothly with haptic feedback

**Step 5: Commit**

```bash
git add mobile/app/recipe/[id]/index.tsx
git commit -m "feat(mobile): replace Publish button with Public/Private toggle"
```

---

## Task 6: Web — Enriched Activity Feed Component

**Files:**
- Modify: `src/app/(authenticated)/home/activity-feed.tsx` (richer cards, new event types)

**Step 1: Update the FeedItem type**

Add `source_url`, `source_name`, and `rating` to the FeedItem interface (matching the updated RPC):

```typescript
interface FeedItem {
  event_type: string;
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name: string;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  rating: number | null;
}
```

**Step 2: Update event type rendering**

Replace the action verb mapping:
- `"created"` → "created"
- `"saved"` → "saved" + show source domain link
- `"cooked"` → "cooked"
- `"rated"` → "rated" + show star rating inline

Each feed card should show:
- Avatar + display name (clickable → profile)
- Action verb + recipe title (clickable → recipe for public, source for saved)
- Recipe thumbnail image (if available)
- For `saved` events: "View source" link to `source_url`
- For `rated` events: star rating display (1-5 stars)
- Notes (if any) in muted italic text
- Relative timestamp

**Step 3: Verify locally**

- Activity feed shows new event types with richer cards
- Saved events show source link
- Rated events show stars

**Step 4: Commit**

```bash
git add src/app/(authenticated)/home/activity-feed.tsx
git commit -m "feat(web): enrich activity feed with new event types and richer cards"
```

---

## Task 7: Web — Home Page Redesign

**Files:**
- Modify: `src/app/(authenticated)/home/page.tsx` (restructure into 3 sections)

**Step 1: Restructure the home page**

The current page has "Recently Updated" + "Your Chefs". Replace with:

**Section A: Activity Feed** (top)
- Reuse the updated `ActivityFeed` component
- Full-width, prominent section
- Empty state: "Follow some chefs to see what they're cooking" → Discover link

**Section B: "Looking for something to cook?"**
- Fetch user's favorited recipes: `recipe_favorites` joined with `recipes`
- If no favorites, fall back to recently saved/imported recipes
- Horizontal scrollable row of recipe cards (small, image + title)
- 6 recipes max

**Section C: Your Recent Activity**
- Fetch user's own recent cook_log + recipe creation (last 3 items)
- Compact list: "[date] You cooked [recipe]" / "[date] You created [recipe]"
- "See all" link to My Recipes

**Step 2: Update server-side data fetching**

Add queries:
```typescript
// Favorites for "Looking for something to cook?"
const { data: favorites } = await supabase
  .from("recipe_favorites")
  .select("recipe_id, recipes(id, title, image_url)")
  .eq("user_id", user.id)
  .limit(6);

// Fallback: recent recipes if no favorites
const { data: recentRecipes } = await supabase
  .from("recipes")
  .select("id, title, image_url")
  .eq("created_by", user.id)
  .order("created_at", { ascending: false })
  .limit(6);

// Your recent activity
const { data: recentCooks } = await supabase
  .from("cook_log")
  .select("id, cooked_at, notes, recipe_id, recipes(title)")
  .eq("user_id", user.id)
  .order("cooked_at", { ascending: false })
  .limit(3);
```

**Step 3: Verify locally**

- Home page shows 3 distinct sections
- Activity feed is prominent at top
- "Looking for something to cook?" shows favorites or recent recipes
- Your recent activity shows last 3 items

**Step 4: Commit**

```bash
git add src/app/(authenticated)/home/
git commit -m "feat(web): redesign Home page with feed, suggestions, and recent activity"
```

---

## Task 8: Mobile — Enriched Activity Feed Cards

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx` (update feed rendering, new event types)

**Step 1: Update FeedItem type**

Same as web — add `source_url`, `source_name`, `rating` to the interface.

**Step 2: Update feed card rendering**

The home tab already has an activity feed section ("Your Chefs"). Update the event type display:
- `"created"` → "created" (was "published")
- `"saved"` → "saved" + show source domain (was "recommended")
- `"cooked"` → "cooked" (unchanged)
- `"rated"` → "rated" + inline stars (new)

For `saved` events, add a "View source" text that opens `source_url` in the browser via `Linking.openURL()`.

For `rated` events, show a row of star icons using the existing `StarRating` component.

**Step 3: Verify locally**

- Feed shows new event types with proper rendering
- Saved events have tappable source link
- Rated events show stars

**Step 4: Commit**

```bash
git add mobile/app/(tabs)/index.tsx
git commit -m "feat(mobile): enrich activity feed with new event types"
```

---

## Task 9: Mobile — Home Tab Redesign

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx` (restructure into 3 sections)

**Step 1: Restructure the home tab**

Replace the current "Recently Updated" + "Your Chefs" layout with:

**Section A: Activity Feed**
- Keep the existing feed logic but make it the primary content
- Rich cards (from Task 8)
- Pull-to-refresh, infinite scroll
- Empty state: "Follow some chefs to see what they're cooking" → button to Discover tab

**Section B: "Looking for something to cook?"**
- Horizontal `FlatList` of favorited recipes
- Falls back to recently saved if no favorites
- Each card: recipe image thumbnail + title (compact, ~120px wide)
- Tapping navigates to recipe detail

**Section C: Your Recent Activity**
- Compact vertical list (3 items max)
- Shows: "You [cooked/created/saved] [recipe title]" with relative timestamp
- "See all" button → navigates to My Recipes tab

**Step 2: Add data fetching**

```typescript
// Fetch favorites for suggestions
const { data: favorites } = await supabase
  .from('recipe_favorites')
  .select('recipe_id, recipes(id, title, image_url)')
  .eq('user_id', user.id)
  .limit(6);

// Fetch recent personal activity
const { data: recentCooks } = await supabase
  .from('cook_log')
  .select('id, cooked_at, notes, recipe_id, recipes(title)')
  .eq('user_id', user.id)
  .order('cooked_at', { ascending: false })
  .limit(3);
```

**Step 3: Style with theme tokens**

Use `colors`, `spacing`, `typography` from `@/lib/theme`. Section headers use `typography.h3`. Cards use `colors.card` background with `radii.lg` corners. Horizontal list has `spacing.pagePadding` padding.

**Step 4: Verify locally**

- Home tab shows 3 sections
- Feed is prominent, scrollable
- "Looking for something to cook?" shows horizontal recipe cards
- Recent activity shows compact list

**Step 5: Commit**

```bash
git add mobile/app/(tabs)/index.tsx
git commit -m "feat(mobile): redesign Home tab with feed, suggestions, and recent activity"
```

---

## Task 10: Platform Parity Check + Final Cleanup

**Files:**
- Delete: `src/app/(authenticated)/recipes/[id]/publish-button.tsx` (if not already removed in Task 4)
- Modify: `docs/PRODUCT.md` (update roadmap: mark social defaults as shipped)
- Modify: `docs/PLATFORM-PARITY.md` (update parity report)

**Step 1: Run platform-sync agent**

Use the `platform-sync` agent to verify web and mobile have matching features.

**Step 2: Clean up dead code**

- Remove unused imports (PublishButton, old share flow)
- Remove publish limit references from both platforms
- Remove `publishCount` and `userPlan` state/queries that are no longer needed

**Step 3: Update documentation**

In `docs/PRODUCT.md`, update the features list:
- Mark "Social defaults (public-first recipes)" as shipped
- Mark "Auto-recommend imports" as shipped
- Mark "Home tab redesign" as shipped
- Mark "Enriched activity feed" as shipped

**Step 4: Full visual review**

Review all affected screens on both platforms:
- Home tab (web + mobile)
- Recipe detail (web + mobile) — toggle works, badge shows
- Recipe lists — lock icon on private recipes
- Activity feed — all 4 event types render correctly
- Discover — still works correctly (public recipes)

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: cleanup dead code, update docs after social defaults feature"
```
