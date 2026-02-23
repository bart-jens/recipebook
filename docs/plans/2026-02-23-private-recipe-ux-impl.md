# Private Recipe UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make private recipe restrictions legible to users by showing all cook activity in the feed, explaining *why* recipes are private with warm plain-language copy, and handling private recipe entries gracefully throughout the UI.

**Architecture:** One DB migration updates two functions (`get_chef_profile` activity query removes visibility filter + adds source fields; `get_activity_feed` adds `recipe_source_type` to its return). Frontend changes are copy updates + link-handling logic for private recipe entries. No new columns needed — the existing `source_type` distinction (`manual` vs `photo`/`url`) already encodes "personal" vs "published source".

**Key insight:** The `activity_feed_view` already shows all cook events with no visibility filter. The gap is (1) `get_chef_profile` activity tab still filters to public recipes only, (2) the feed renders private recipe entries with a broken link to the recipe page, and (3) copy throughout is terse and doesn't explain the "personal cookbook" concept.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Supabase PostgreSQL, React Native / Expo Router

**Platform parity:** every change ships on both web and mobile in the same commit.

---

## Link logic for private recipe entries (used in Tasks 3, 4, 6, 7)

When rendering a cook activity entry, use this decision tree:

```
recipe_visibility === 'public'
  → link to /recipes/{id}

recipe_visibility === 'private' AND source_url != null
  → link title to source_url (external, target=_blank)
  → label: "via {source_name or domain}"

recipe_visibility === 'private' AND source_url == null AND source_type === 'manual'
  → link to /recipes/{id} (user's own unpublished recipe)
  → no source label

recipe_visibility === 'private' AND source_url == null AND source_type !== 'manual'
  → no link (render title as plain text)
  → label: "from a cookbook"
```

---

## Task 1: DB migration — update get_chef_profile + get_activity_feed

**Files:**
- Create: `supabase/migrations/20240101000049_activity_all_recipes.sql`

**Step 1: Create the migration file**

Create `supabase/migrations/20240101000049_activity_all_recipes.sql` with this content:

```sql
-- Update get_chef_profile: show all cook activity (not just public recipes)
-- and include source fields so frontend can render attribution.
--
-- Update get_activity_feed: add recipe_source_type to return so frontend
-- can distinguish cookbook imports from URL imports.

-- ============================================================
-- 1. get_chef_profile — remove visibility filter from activity
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_chef_profile(p_chef_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_profile record;
  v_is_owner boolean;
  v_is_follower boolean;
  v_can_view boolean;
  v_result jsonb;
  v_stats jsonb;
  v_activity jsonb;
  v_favorites jsonb;
  v_published jsonb;
BEGIN
  -- Fetch profile
  SELECT id, display_name, bio, is_private, avatar_url
  INTO v_profile
  FROM public.user_profiles
  WHERE id = p_chef_id;

  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_is_owner := (v_caller_id = p_chef_id);

  -- Check follow status
  v_is_follower := EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE follower_id = v_caller_id AND following_id = p_chef_id
  );

  -- Can view tab data if: owner, follower, or public profile
  v_can_view := v_is_owner OR v_is_follower OR NOT v_profile.is_private;

  -- Stats
  SELECT jsonb_build_object(
    'recipe_count', (
      SELECT count(*) FROM public.recipes
      WHERE created_by = p_chef_id
        AND (visibility = 'public' OR created_by = v_caller_id)
    ),
    'cook_count', (
      SELECT count(DISTINCT cl.recipe_id) FROM public.cook_log cl
      WHERE cl.user_id = p_chef_id
    ),
    'follower_count', (SELECT count(*) FROM public.user_follows WHERE following_id = p_chef_id),
    'following_count', (SELECT count(*) FROM public.user_follows WHERE follower_id = p_chef_id)
  ) INTO v_stats;

  -- Tab data (only if allowed)
  IF v_can_view THEN
    -- Activity: ALL cook_log entries, with source fields for attribution.
    -- Private recipe titles are safe to expose (not copyrightable).
    -- Frontend uses source_url + source_type to decide how to link.
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.cooked_at DESC), '[]'::jsonb)
    INTO v_activity
    FROM (
      SELECT
        cl.recipe_id,
        cl.cooked_at,
        cl.notes,
        r.title AS recipe_title,
        r.image_url AS recipe_image_url,
        r.source_url,
        r.source_name,
        r.source_type,
        r.visibility AS recipe_visibility
      FROM public.cook_log cl
      JOIN public.recipes r ON r.id = cl.recipe_id
      WHERE cl.user_id = p_chef_id
      ORDER BY cl.cooked_at DESC
      LIMIT 20
    ) t;

    -- Favorites: public recipes only (private recipe titles not shown in others' favorites)
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.favorited_at DESC), '[]'::jsonb)
    INTO v_favorites
    FROM (
      SELECT rf.recipe_id, rf.created_at AS favorited_at,
             r.title AS recipe_title, r.image_url AS recipe_image_url,
             rr.rating
      FROM public.recipe_favorites rf
      JOIN public.recipes r ON r.id = rf.recipe_id
      LEFT JOIN public.recipe_ratings rr ON rr.recipe_id = rf.recipe_id AND rr.user_id = p_chef_id
      WHERE rf.user_id = p_chef_id
        AND (r.visibility = 'public' OR r.created_by = v_caller_id)
      ORDER BY rf.created_at DESC
    ) t;

    -- Published: public recipes
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.published_at DESC), '[]'::jsonb)
    INTO v_published
    FROM (
      SELECT r.id, r.title, r.description, r.image_url, r.prep_time_minutes, r.cook_time_minutes, r.published_at
      FROM public.recipes r
      WHERE r.created_by = p_chef_id AND r.visibility = 'public'
      ORDER BY r.published_at DESC
    ) t;
  ELSE
    v_activity := '[]'::jsonb;
    v_favorites := '[]'::jsonb;
    v_published := '[]'::jsonb;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'display_name', v_profile.display_name,
      'bio', v_profile.bio,
      'is_private', v_profile.is_private,
      'avatar_url', v_profile.avatar_url
    ),
    'stats', v_stats,
    'is_following', v_is_follower,
    'is_owner', v_is_owner,
    'can_view', v_can_view,
    'activity', v_activity,
    'favorites', v_favorites,
    'published', v_published
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- 2. get_activity_feed — add recipe_source_type to return
-- Must DROP first because we're changing the return type.
-- ============================================================

DROP FUNCTION IF EXISTS public.get_activity_feed(uuid, timestamptz, int);

CREATE FUNCTION public.get_activity_feed(
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
  rating integer,
  recipe_visibility text,
  recipe_source_type text
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
    af.rating,
    r.visibility::text AS recipe_visibility,
    r.source_type::text AS recipe_source_type
  FROM activity_feed_view af
  JOIN user_follows uf ON uf.following_id = af.user_id AND uf.follower_id = p_user_id
  JOIN user_profiles up ON up.id = af.user_id
  JOIN recipes r ON r.id = af.recipe_id
  WHERE af.event_at < p_before
    AND up.is_hidden IS NOT TRUE
  ORDER BY af.event_at DESC
  LIMIT p_limit;
$$;
```

**Step 2: Push migration to production**

```bash
npx supabase db push
```

Expected: `Applying migration 20240101000049_activity_all_recipes.sql... Finished supabase db push.`

**Step 3: Commit**

```bash
git add supabase/migrations/20240101000049_activity_all_recipes.sql
git commit -m "feat: show all cook activity in chef profile tab, add source_type to feed RPC"
```

---

## Task 2: Web — update publish-banner.tsx copy for imported recipes

**Files:**
- Modify: `src/app/(authenticated)/recipes/[id]/publish-banner.tsx`

Read the file first. Find the "Imported recipe — informational only" block (the final `return` at the bottom, rendered when `canPublish` is false). It currently says:

```tsx
<p className="text-[12px] font-light text-ink-secondary">
  Saved to your private collection. Only you can see this.
</p>
```

**Step 1: Update the banner to accept source props and show warm copy**

Change the component signature to accept `sourceUrl` and `sourceName`:

```tsx
export function PublishBanner({
  recipeId,
  initialVisibility,
  sourceType,
  sourceUrl,
  sourceName,
}: {
  recipeId: string;
  initialVisibility: string;
  sourceType: string;
  sourceUrl?: string | null;
  sourceName?: string | null;
}) {
```

**Step 2: Update the imported recipe banner copy**

Replace the informational-only `return` block (the one with the lock icon and "Saved to your private collection") with:

```tsx
// Imported recipe — explain personal cookbook concept
const sourceLabel = sourceName || (sourceUrl ? (() => { try { return new URL(sourceUrl).hostname.replace(/^www\./, ''); } catch { return null; } })() : null);

return (
  <div className="mx-5 mt-4 px-4 py-3 bg-surface border border-border">
    <p className="text-[12px] font-light text-ink-secondary leading-snug">
      From your personal cookbook.{' '}
      {sourceLabel && sourceUrl ? (
        <>
          Saved from{' '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            {sourceLabel}
          </a>
          .{' '}
        </>
      ) : sourceLabel ? (
        <>Saved from {sourceLabel}. </>
      ) : (
        <>Saved from a cookbook. </>
      )}
      Your followers will see when you cook it.
    </p>
  </div>
);
```

**Step 3: Pass the new props from recipe-detail.tsx**

Read `src/app/(authenticated)/recipes/[id]/recipe-detail.tsx`. Find where `PublishBanner` is rendered (search for `<PublishBanner`). Add `sourceUrl` and `sourceName` props:

```tsx
<PublishBanner
  recipeId={recipe.id}
  initialVisibility={recipe.visibility}
  sourceType={recipe.source_type}
  sourceUrl={recipe.source_url}
  sourceName={recipe.source_name}
/>
```

**Step 4: Commit**

```bash
git add src/app/(authenticated)/recipes/[id]/publish-banner.tsx \
        src/app/(authenticated)/recipes/[id]/recipe-detail.tsx
git commit -m "feat: warmer copy on private recipe banner, show source attribution"
```

---

## Task 3: Web — fix activity feed rendering for private recipe entries

**Files:**
- Modify: `src/app/(authenticated)/home/activity-feed.tsx`

Read the file. The `recipeLink()` function currently returns the same URL for public and private recipes (both go to `/recipes/{id}`). Fix this + handle the "from a cookbook" case.

**Step 1: Replace the `recipeLink` function and add a link-type helper**

Remove the existing `recipeLink` function and replace with:

```tsx
type LinkTarget =
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'none' };

function resolveLink(item: FeedItem): LinkTarget {
  if (item.recipe_visibility === 'public') {
    return { kind: 'internal', href: `/recipes/${item.recipe_id}` };
  }
  if (item.source_url) {
    return { kind: 'external', href: item.source_url };
  }
  if (item.recipe_source_type === 'manual' || item.recipe_source_type === 'fork') {
    return { kind: 'internal', href: `/recipes/${item.recipe_id}` };
  }
  return { kind: 'none' };
}
```

**Step 2: Update the render to use `resolveLink`**

In the `items.map()` block, replace the existing link logic:

```tsx
const link = resolveLink(item);
const sourceDisplay = item.source_name
  || (item.source_url ? (() => { try { return new URL(item.source_url!).hostname.replace(/^www\./, ''); } catch { return item.source_url; } })() : null)
  || (item.recipe_visibility === 'private' && item.recipe_source_type !== 'manual' && item.recipe_source_type !== 'fork' ? 'a cookbook' : null);

// Recipe title rendering:
{link.kind === 'internal' ? (
  <Link href={link.href} className="font-normal text-accent hover:underline">
    {item.recipe_title}
  </Link>
) : link.kind === 'external' ? (
  <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-normal text-accent hover:underline">
    {item.recipe_title}
  </a>
) : (
  <span className="font-normal text-accent">{item.recipe_title}</span>
)}
```

Also update the source attribution line to use the updated `sourceDisplay`:

```tsx
{sourceDisplay && (
  <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
    {item.source_url && link.kind === 'external'
      ? `via ${sourceDisplay}`
      : `from ${sourceDisplay}`}
  </span>
)}
```

Remove the now-unused `const isExternal` and old `const href = recipeLink(item)` lines.

**Step 3: Commit**

```bash
git add src/app/(authenticated)/home/activity-feed.tsx
git commit -m "feat: handle private recipe entries in activity feed — link to source or no link"
```

---

## Task 4: Web — update profile-tabs.tsx activity tab

**Files:**
- Modify: `src/app/(authenticated)/profile/[id]/profile-tabs.tsx`
- Modify: `src/app/(authenticated)/profile/[id]/page.tsx`

**Step 1: Update the ActivityItem interface in profile-tabs.tsx**

Find the `ActivityItem` interface and extend it:

```tsx
interface ActivityItem {
  recipe_id: string;
  recipe_title: string;
  recipe_image_url?: string | null;
  cooked_at: string;
  notes: string | null;
  source_url?: string | null;
  source_name?: string | null;
  source_type?: string | null;
  recipe_visibility?: string | null;
}
```

**Step 2: Add the same `resolveLink` helper**

Above the `ProfileTabs` component, add:

```tsx
type LinkTarget =
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'none' };

function resolveActivityLink(item: ActivityItem): LinkTarget {
  if (item.recipe_visibility === 'public' || !item.recipe_visibility) {
    return { kind: 'internal', href: `/recipes/${item.recipe_id}` };
  }
  if (item.source_url) {
    return { kind: 'external', href: item.source_url };
  }
  if (item.source_type === 'manual' || item.source_type === 'fork') {
    return { kind: 'internal', href: `/recipes/${item.recipe_id}` };
  }
  return { kind: 'none' };
}
```

**Step 3: Update the activity tab render**

Find the `{activeTab === "activity" && ...}` block. Replace the current `<Link>` wrapper on each activity item with logic that uses `resolveActivityLink`:

```tsx
{activity.map((item, i) => {
  const link = resolveActivityLink(item);
  const sourceLabel = item.source_name
    || (item.source_url ? (() => { try { return new URL(item.source_url!).hostname.replace(/^www\./, ''); } catch { return null; } })() : null)
    || (item.recipe_visibility === 'private' && item.source_type !== 'manual' && item.source_type !== 'fork' ? 'a cookbook' : null);

  const inner = (
    <>
      {item.recipe_image_url ? (
        <img
          src={item.recipe_image_url}
          alt={item.recipe_title}
          className="w-9 h-9 object-cover shrink-0 transition-transform duration-300 group-hover:scale-[1.1]"
          style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      ) : (
        <RecipePlaceholder id={item.recipe_id} size={36} className="shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-light text-ink leading-[1.35]">
          Cooked <span className="font-normal text-accent">{item.recipe_title}</span>
        </p>
        {sourceLabel && (
          <p className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">
            {item.source_url && link.kind === 'external' ? `via ${sourceLabel}` : `from ${sourceLabel}`}
          </p>
        )}
        {item.notes && (
          <p className="text-[12px] font-light text-ink-muted italic mt-0.5 line-clamp-1">
            &ldquo;{item.notes}&rdquo;
          </p>
        )}
      </div>
      <span className="text-[11px] font-normal tracking-[0.02em] text-ink-muted shrink-0">
        {formatDate(item.cooked_at)}
      </span>
    </>
  );

  const className = "group flex gap-2.5 py-2.5 border-b border-border items-center transition-all duration-150 hover:bg-accent-light hover:-mx-1.5 hover:px-1.5";

  return link.kind === 'internal' ? (
    <Link key={`${item.recipe_id}-${item.cooked_at}-${i}`} href={link.href} className={className}>
      {inner}
    </Link>
  ) : link.kind === 'external' ? (
    <a key={`${item.recipe_id}-${item.cooked_at}-${i}`} href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <div key={`${item.recipe_id}-${item.cooked_at}-${i}`} className={className.replace('cursor-pointer', '')}>
      {inner}
    </div>
  );
})}
```

**Step 4: Update the ChefProfileData type in page.tsx**

Read `src/app/(authenticated)/profile/[id]/page.tsx`. Find the `ChefProfileData` interface. Update the `activity` array type:

```tsx
activity: Array<{
  recipe_id: string;
  recipe_title: string;
  recipe_image_url: string | null;
  cooked_at: string;
  notes: string | null;
  source_url: string | null;
  source_name: string | null;
  source_type: string | null;
  recipe_visibility: string | null;
}>;
```

**Step 5: Commit**

```bash
git add src/app/(authenticated)/profile/[id]/profile-tabs.tsx \
        src/app/(authenticated)/profile/[id]/page.tsx
git commit -m "feat: show all cook activity in profile tab with source attribution and correct links"
```

---

## Task 5: Web — import page copy updates

**Files:**
- Modify: `src/app/(authenticated)/recipes/import/page.tsx`
- Modify: `src/app/(authenticated)/recipes/import-url/page.tsx`
- Modify: `src/app/(authenticated)/recipes/import-photo/page.tsx`

### 5a: Import chooser page

Read `src/app/(authenticated)/recipes/import/page.tsx`. Find the heading and subheading:

```tsx
<h1 className="mt-2 text-2xl font-normal">Import Recipe</h1>
<p className="mt-1 text-sm text-warm-gray">
  Choose how you want to import your recipe.
</p>
```

Replace with:

```tsx
<h1 className="mt-2 text-[28px] font-light tracking-[-0.02em] text-ink">Import Recipe</h1>
<p className="mt-1 text-[13px] font-light text-ink-secondary leading-[1.45]">
  Recipes you import are saved to your personal cookbook — only you can see them.
  Your cooking activity still appears in your feed.
</p>
```

### 5b: URL import — post-extraction notice

Read `src/app/(authenticated)/recipes/import-url/page.tsx`. Find the notice that appears after extraction. It currently says:

```tsx
"This will be saved to your private collection. Only you can see it."
```

Replace the copy in that notice `<p>` with:

```tsx
Saved to your personal cookbook — only you can see the full recipe.
Your cooking activity will still appear in your feed.
```

### 5c: Photo import — source choice copy

Read `src/app/(authenticated)/recipes/import-photo/page.tsx`. Find the two radio button labels. The current copy is:
- "I made this myself"
- "From a cookbook or other source"

Update them to:
- "Personal recipe — family, friend, or my own creation" (value stays `"own"`)
- "From a cookbook, magazine, or website" (value stays `"external"`)

Also find where the external source choice is shown as selected — if there's a helper text or note, add:

```tsx
<p className="text-[11px] font-light text-ink-muted mt-1">
  The full recipe stays in your personal cookbook. Your cooking activity will still appear in your feed.
</p>
```

Add this below the "From a cookbook, magazine, or website" label, only visible when that option is selected (or always visible below the choice).

**Step: Commit**

```bash
git add src/app/(authenticated)/recipes/import/page.tsx \
        src/app/(authenticated)/recipes/import-url/page.tsx \
        src/app/(authenticated)/recipes/import-photo/page.tsx
git commit -m "feat: personal cookbook framing on import pages"
```

---

## Task 6: Mobile — update activity feed rendering for private entries

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx`

Read the file. Find `renderTickerItem` (around line 357). The recipe title currently always links to `/recipe/${item.recipe_id}`.

**Step 1: Add a `resolveLink` helper above the component**

```tsx
type FeedLinkTarget =
  | { kind: 'internal'; path: string }
  | { kind: 'external'; url: string }
  | { kind: 'none' };

function resolveLink(item: FeedItem): FeedLinkTarget {
  if (item.recipe_visibility === 'public') {
    return { kind: 'internal', path: `/recipe/${item.recipe_id}` };
  }
  if (item.source_url) {
    return { kind: 'external', url: item.source_url };
  }
  if (item.recipe_source_type === 'manual' || item.recipe_source_type === 'fork') {
    return { kind: 'internal', path: `/recipe/${item.recipe_id}` };
  }
  return { kind: 'none' };
}
```

**Step 2: Update `renderTickerItem` to use `resolveLink`**

Inside `renderTickerItem`, replace the recipe title `<Text>` that uses `onPress={() => router.push(...)}`:

```tsx
{(() => {
  const link = resolveLink(item);
  const onPressRecipe = link.kind === 'internal'
    ? () => router.push(link.path as any)
    : link.kind === 'external'
    ? () => Linking.openURL(link.url)
    : undefined;

  return (
    <Text style={styles.tickerRecipe} onPress={onPressRecipe}>
      {item.recipe_title}
    </Text>
  );
})()}
```

Make sure `Linking` is imported: add `import { Linking } from 'react-native';` to the imports if not already present.

**Step 3: Update source attribution to handle "from a cookbook"**

Find the source attribution block:

```tsx
{(item.source_name || item.source_url) && (
  <Text style={styles.tickerSource}>
    via {item.source_name || ...}
  </Text>
)}
```

Replace with:

```tsx
{(() => {
  const sourceLabel = item.source_name
    || (item.source_url ? (() => { try { return new URL(item.source_url!).hostname.replace(/^www\./, ''); } catch { return null; } })() : null)
    || (item.recipe_visibility === 'private' && item.recipe_source_type !== 'manual' && item.recipe_source_type !== 'fork' ? 'a cookbook' : null);

  if (!sourceLabel) return null;
  const prefix = item.source_url ? 'via' : 'from';
  return <Text style={styles.tickerSource}>{prefix} {sourceLabel}</Text>;
})()}
```

**Step 4: Commit**

```bash
git add mobile/app/\(tabs\)/index.tsx
git commit -m "feat: handle private recipe entries in mobile activity feed"
```

---

## Task 7: Mobile — update profile activity tab

**Files:**
- Modify: `mobile/app/profile/[id].tsx`

Read the file. Find the activity type definition (the interface or inline type for `chefData.activity`). Find the activity tab render block (around line 308).

**Step 1: Update the activity type to include source fields**

Find where `activity` items are typed (likely near the top or in the `chefData` type). Add:

```tsx
activity: {
  recipe_id: string;
  recipe_title: string;
  recipe_image_url: string | null;
  cooked_at: string;
  notes: string | null;
  source_url: string | null;
  source_name: string | null;
  source_type: string | null;
  recipe_visibility: string | null;
}[];
```

**Step 2: Add `resolveActivityLink` helper**

Add above the component:

```tsx
type ActivityLinkTarget =
  | { kind: 'internal'; path: string }
  | { kind: 'external'; url: string }
  | { kind: 'none' };

function resolveActivityLink(item: { recipe_id: string; recipe_visibility: string | null; source_url: string | null; source_type: string | null }): ActivityLinkTarget {
  if (item.recipe_visibility === 'public' || !item.recipe_visibility) {
    return { kind: 'internal', path: `/recipe/${item.recipe_id}` };
  }
  if (item.source_url) {
    return { kind: 'external', url: item.source_url };
  }
  if (item.source_type === 'manual' || item.source_type === 'fork') {
    return { kind: 'internal', path: `/recipe/${item.recipe_id}` };
  }
  return { kind: 'none' };
}
```

**Step 3: Update the activity tab render**

Find the `{activeTab === 'activity' && ...}` block. Update `chefData.activity.map(...)` to use the link resolver and show source attribution:

```tsx
{(chefData.activity || []).map((item, i) => {
  const link = resolveActivityLink(item);
  const sourceLabel = item.source_name
    || (item.source_url ? (() => { try { return new URL(item.source_url!).hostname.replace(/^www\./, ''); } catch { return null; } })() : null)
    || (item.recipe_visibility === 'private' && item.source_type !== 'manual' && item.source_type !== 'fork' ? 'a cookbook' : null);

  const handlePress = link.kind === 'internal'
    ? () => router.push(link.path as any)
    : link.kind === 'external'
    ? () => Linking.openURL(link.url)
    : undefined;

  return (
    <Pressable
      key={`${item.recipe_id}-${item.cooked_at}-${i}`}
      style={styles.activityItem}
      onPress={handlePress}
      disabled={!handlePress}
    >
      <View style={styles.activityRow}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {item.recipe_title}
        </Text>
        <Text style={styles.activityDate}>
          {formatDate(item.cooked_at)}
        </Text>
      </View>
      {sourceLabel && (
        <Text style={styles.activitySource}>
          {item.source_url && link.kind === 'external' ? `via ${sourceLabel}` : `from ${sourceLabel}`}
        </Text>
      )}
      {item.notes && (
        <Text style={styles.activityNotes} numberOfLines={2}>
          {'\u201C'}{item.notes}{'\u201D'}
        </Text>
      )}
    </Pressable>
  );
})}
```

Add `activitySource` style in `StyleSheet.create`:

```tsx
activitySource: {
  ...typography.metaSmall,
  color: colors.inkMuted,
  marginTop: 1,
},
```

Make sure `Linking` is imported from `react-native`.

**Step 4: Commit**

```bash
git add mobile/app/profile/\[id\].tsx
git commit -m "feat: show all cook activity in mobile profile tab with source attribution"
```

---

## Task 8: Mobile — import flow copy + recipe detail banner

**Files:**
- Modify: `mobile/app/recipe/import-url.tsx`
- Modify: `mobile/app/recipe/import-photo.tsx`
- Find and modify mobile recipe detail banner (search for the component that shows the private recipe notice in `mobile/app/recipe/[id]/index.tsx` or similar)

### 8a: URL import — post-extraction notice

Read `mobile/app/recipe/import-url.tsx`. Find the notice that appears after extraction:

```tsx
"This will be saved to your private collection. Only you can see it."
```

Replace with:

```tsx
Saved to your personal cookbook — only you can see the full recipe. Your cooking activity will still appear in your feed.
```

### 8b: Photo import — source choice copy

Read `mobile/app/recipe/import-photo.tsx`. Find the two source choice labels. Update:
- "I made this myself" → `"Personal recipe — family, friend, or my own creation"`
- "From a cookbook or other source" → `"From a cookbook, magazine, or website"`

Find where external source explanation text appears (if any) and add or update:

```tsx
<Text style={styles.sourceChoiceNote}>
  The full recipe stays in your personal cookbook. Your cooking activity will still appear in your feed.
</Text>
```

Add style if needed:
```tsx
sourceChoiceNote: {
  ...typography.metaSmall,
  color: colors.inkMuted,
  marginTop: spacing.xs,
},
```

### 8c: Mobile recipe detail — private imported recipe banner

Read `mobile/app/recipe/[id]/index.tsx` (or wherever the mobile recipe detail lives — check the file structure). Search for the equivalent of the web's `PublishBanner`: the component or block that shows when the recipe is private and the user is the owner.

Find the section that says something like "Saved to your private collection" for imported recipes. Update to match the web banner copy:

```tsx
// For imported recipes (canPublish === false):
<View style={styles.publishBanner}>
  <Text style={styles.publishBannerText}>
    From your personal cookbook.{' '}
    {recipe.source_name
      ? `Saved from ${recipe.source_name}. `
      : recipe.source_url
      ? `Saved from the web. `
      : `Saved from a cookbook. `}
    Your followers will see when you cook it.
  </Text>
  {recipe.source_url && (
    <Pressable onPress={() => Linking.openURL(recipe.source_url!)}>
      <Text style={styles.publishBannerLink}>View original recipe</Text>
    </Pressable>
  )}
</View>
```

Add `publishBannerLink` style:
```tsx
publishBannerLink: {
  ...typography.metaSmall,
  color: colors.accent,
  marginTop: spacing.xs,
},
```

**Step: Commit**

```bash
git add mobile/app/recipe/import-url.tsx \
        mobile/app/recipe/import-photo.tsx \
        mobile/app/recipe/\[id\]/index.tsx
git commit -m "feat: personal cookbook framing on mobile import and recipe detail"
```

---

## Task 9: Push and verify

**Step 1: Push all commits**

```bash
git push
```

**Step 2: Verify on web**

- Go to `/home` — find a cook entry for a URL-imported private recipe. Confirm title links to source_url, shows "via [source]".
- Find a cookbook cook entry (no source_url). Confirm title is plain text, shows "from a cookbook".
- Open `/recipes/import` — confirm new framing paragraph.
- Import a URL recipe — confirm post-extraction notice says "personal cookbook" + "activity still appears".
- Open a private URL-imported recipe — confirm banner says "From your personal cookbook · Saved from [source] · Your followers will see when you cook it."
- Visit someone's profile with private recipe cooks — confirm activity tab shows them with attribution.

**Step 3: Verify on mobile**

- Home feed: same link/attribution checks as web.
- Import URL: notice copy.
- Import Photo: source choice labels updated.
- Profile activity tab: private recipe cooks visible with attribution.
- Recipe detail: imported recipe banner shows warm copy + "View original recipe" link if source_url.

**Step 4: Verify cook count bug (from earlier)**

- Visit mago's profile — cook count should now show > 0 (fixed in migration 048, applied earlier).
- Visit mago's profile activity tab — should now show their cook entries (fixed in this migration).
