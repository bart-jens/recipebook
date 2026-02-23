# Publish & Visibility UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the private/public model legible to users and actively encourage publishing original recipes by surfacing clear, contextual calls-to-action across the recipe detail, list, import flow, cook log, and profile — on both web and mobile.

**Architecture:** Additive UI changes only — no schema changes. A new `publishRecipe` server action (publish-only, not a toggle) powers all new "Publish" buttons. A `PublishBanner` client component in the recipe detail is the primary publishing surface. The recipe list and cook log get secondary nudges. The own profile stats are recomputed from existing data.

**Key rules (read before touching anything):**
- Only `source_type = 'manual'` and `source_type = 'fork'` recipes can be published (DB CHECK constraint). All other source types (url, instagram, photo, telegram) are permanently private.
- The existing `toggleVisibility` action in `src/app/(authenticated)/recipes/[id]/actions.ts` handles both directions (private↔public) and already sets `published_at`. Keep it for the nav toggle (unpublish). New "Publish" buttons use the new `publishRecipe` action instead.
- Both web and mobile must be updated in the same change. Platform parity is required.
- No emojis, no hardcoded colors — use Tailwind tokens (web) and theme tokens (mobile).

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Supabase, React Native / Expo Router

---

### Task 1: Add `publishRecipe` server action (web)

**Files:**
- Modify: `src/app/(authenticated)/recipes/[id]/actions.ts`

This is a publish-only action (private → public, idempotent). All new "Publish" buttons use this instead of `toggleVisibility` (which toggles both ways).

**Step 1: Add the action**

Open `src/app/(authenticated)/recipes/[id]/actions.ts`. At the end of the file, add:

```ts
export async function publishRecipe(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("recipes")
    .update({ visibility: "public", published_at: new Date().toISOString() })
    .eq("id", recipeId)
    .eq("created_by", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
  revalidatePath("/profile");
  revalidatePath("/discover");
  return { success: true };
}
```

**Step 2: Commit**

```bash
git -C /Users/bart/claude/together-map add src/app/(authenticated)/recipes/[id]/actions.ts
git -C /Users/bart/claude/together-map commit -m "feat: add publishRecipe server action"
```

---

### Task 2: Web recipe detail — PublishBanner component

This is the primary publish surface. Shown below the stats bar for any recipe the user owns that is private.

**Files:**
- Create: `src/app/(authenticated)/recipes/[id]/publish-banner.tsx`
- Modify: `src/app/(authenticated)/recipes/[id]/recipe-detail.tsx` (lines 163–169, add banner after stats bar)
- Modify: `src/app/(authenticated)/recipes/[id]/visibility-toggle.tsx` (fix fork condition)

**Step 1: Create `publish-banner.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { publishRecipe } from "./actions";

export function PublishBanner({
  recipeId,
  initialVisibility,
  sourceType,
}: {
  recipeId: string;
  initialVisibility: string;
  sourceType: string;
}) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [loading, setLoading] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  const canPublish = sourceType === "manual" || sourceType === "fork";

  // Already public — nothing to show
  if (visibility === "public") return null;

  if (justPublished) {
    return (
      <div className="mx-5 mt-4 px-4 py-3 bg-olive/10 border border-olive/30 flex items-center gap-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-olive shrink-0">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <p className="text-[12px] font-normal text-olive">
          Published — your followers can now see this recipe in their feed.
        </p>
      </div>
    );
  }

  if (canPublish) {
    return (
      <div className="mx-5 mt-4 px-4 py-3 bg-surface border border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <p className="text-[12px] font-light text-ink-secondary leading-snug">
            Your followers can&apos;t see when you cook this.{" "}
            <span className="text-ink-muted">Publish it to share with them.</span>
          </p>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            const result = await publishRecipe(recipeId);
            if (!result?.error) {
              setVisibility("public");
              setJustPublished(true);
            }
            setLoading(false);
          }}
          disabled={loading}
          className="shrink-0 text-[11px] font-normal tracking-[0.02em] bg-ink text-bg px-3 py-1.5 hover:bg-ink/80 transition-colors active:scale-[0.96] disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    );
  }

  // Imported recipe — informational only
  return (
    <div className="mx-5 mt-4 px-4 py-3 bg-surface border border-border flex items-center gap-2">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted shrink-0">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <p className="text-[12px] font-light text-ink-secondary">
        Saved to your private collection. Only you can see this.
      </p>
    </div>
  );
}
```

**Step 2: Add banner to `recipe-detail.tsx`**

Read the file. Find the closing `</div>` of the Stats Bar section (around line 325). After the stats bar `</div>` and before the Tags + Controls Row `<div className="px-5 pt-4 ...">`, insert:

```tsx
{/* Publish / Private banner — owner only */}
{isOwner && (
  <PublishBanner
    recipeId={recipe.id}
    initialVisibility={recipe.visibility}
    sourceType={recipe.source_type}
  />
)}
```

Also add the import at the top of the file:
```tsx
import { PublishBanner } from "./publish-banner";
```

**Step 3: Fix fork condition in `visibility-toggle.tsx`**

Read the file. Find line:
```tsx
{recipe.source_type === "manual" && !recipe.forked_from_id && (
```

Change to:
```tsx
{(recipe.source_type === "manual" || recipe.source_type === "fork") && (
```

This fixes the bug where forks couldn't be toggled despite the DB allowing it.

**Step 4: Commit**

```bash
git -C /Users/bart/claude/together-map add \
  src/app/(authenticated)/recipes/\[id\]/publish-banner.tsx \
  src/app/(authenticated)/recipes/\[id\]/recipe-detail.tsx \
  src/app/(authenticated)/recipes/\[id\]/visibility-toggle.tsx
git -C /Users/bart/claude/together-map commit -m "feat: add publish banner to recipe detail, fix fork visibility toggle"
```

**Step 5: Manual test**
- Open a private manual recipe you own → banner should appear below stats bar: "Your followers can't see when you cook this. [Publish]"
- Click Publish → banner swaps to green "Published — your followers can now see this recipe in their feed."
- Open a private URL-imported recipe you own → banner shows "Saved to your private collection. Only you can see this."
- Open a public recipe → no banner

---

### Task 3: Web recipe list — lock indicator + inline publish button

Add a visibility indicator to every private recipe card in `/recipes`. For private manual recipes, show a tappable "Publish" link.

**Files:**
- Create: `src/app/(authenticated)/recipes/publish-inline.tsx`
- Modify: `src/app/(authenticated)/recipes/page.tsx`

**Step 1: Create `publish-inline.tsx`**

This is a client component because it needs optimistic state for the publish action.

```tsx
"use client";

import { useState } from "react";
import { publishRecipe } from "./[id]/actions";

export function PublishInline({
  recipeId,
  sourceType,
}: {
  recipeId: string;
  sourceType: string;
}) {
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const canPublish = sourceType === "manual" || sourceType === "fork";

  if (published) {
    return (
      <span className="text-[10px] font-normal tracking-[0.02em] text-olive flex items-center gap-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        Published
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted/60 shrink-0">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span className="text-[10px] font-normal tracking-[0.02em] text-ink-muted/60">Private</span>
      {canPublish && (
        <>
          <span className="text-ink-muted/40">·</span>
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setLoading(true);
              const result = await publishRecipe(recipeId);
              if (!result?.error) setPublished(true);
              setLoading(false);
            }}
            disabled={loading}
            className="text-[10px] font-normal tracking-[0.02em] text-accent hover:underline disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Publish"}
          </button>
        </>
      )}
    </span>
  );
}
```

**Step 2: Add to recipe list cards in `page.tsx`**

Read the file. Find the recipe list map (around line 278). Each `<Link>` item currently has a meta row:

```tsx
<div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted flex gap-2.5 mt-0.5">
  {timeStr && <span>{timeStr}</span>}
  ...
</div>
```

Add at the bottom of `src/app/(authenticated)/recipes/page.tsx` imports:
```tsx
import { PublishInline } from "./publish-inline";
```

Then in the meta row, after the existing content, add:
```tsx
{recipe.visibility === "private" && !recipe.isSaved && (
  <PublishInline recipeId={recipe.id} sourceType={recipe.source_type} />
)}
```

Note: `!recipe.isSaved` ensures we only show this for owned recipes, not recipes saved from others.

**Step 3: Commit**

```bash
git -C /Users/bart/claude/together-map add \
  src/app/(authenticated)/recipes/publish-inline.tsx \
  src/app/(authenticated)/recipes/page.tsx
git -C /Users/bart/claude/together-map commit -m "feat: add visibility indicator and inline publish to recipe list"
```

**Step 4: Manual test**
- `/recipes` — private manual recipe shows lock icon + "Private · Publish" in meta row
- Click "Publish" (without navigating away) → swaps to green globe + "Published" inline
- Private imported recipe shows lock icon + "Private" with no Publish link
- Public recipe shows nothing extra

---

### Task 4: Web import flow — private collection notice

A one-line informational note shown when the extracted recipe form appears.

**Files:**
- Modify: `src/app/(authenticated)/recipes/import-url/page.tsx`

**Step 1: Add notice**

Read the file. Find the block that renders when `importedData` is set (around line 150):

```tsx
) : (
  <div>
    <p className="mb-4 text-sm text-warm-gray">
      Imported from: {importedData.source_url}
    </p>
    <RecipeForm
```

Change it to:

```tsx
) : (
  <div>
    <p className="mb-4 text-sm text-warm-gray">
      Imported from: {importedData.source_url}
    </p>
    <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-surface border border-border">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted shrink-0">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <p className="text-[12px] font-light text-ink-secondary">
        This will be saved to your private collection. Only you can see it.
      </p>
    </div>
    <RecipeForm
```

**Step 2: Commit**

```bash
git -C /Users/bart/claude/together-map add src/app/(authenticated)/recipes/import-url/page.tsx
git -C /Users/bart/claude/together-map commit -m "feat: show private collection notice on import flow"
```

---

### Task 5: Web cook log — publish nudge after logging on private recipe

After a cook is logged on a private manual recipe, show a nudge encouraging the user to publish.

**Files:**
- Modify: `src/app/(authenticated)/recipes/[id]/cooking-log.tsx`

**Step 1: Update CookingLog to accept `isPrivateManual` prop**

Read the file. Change the component signature from:

```tsx
export function CookingLog({
  recipeId,
  cookEntries,
  ratings,
}: {
  recipeId: string;
  cookEntries: CookEntry[];
  ratings: RatingEntry[];
})
```

To:

```tsx
export function CookingLog({
  recipeId,
  cookEntries,
  ratings,
  isPrivateManual = false,
}: {
  recipeId: string;
  cookEntries: CookEntry[];
  ratings: RatingEntry[];
  isPrivateManual?: boolean;
})
```

**Step 2: Add nudge state and import**

At the top of the file, add to imports:
```tsx
import { publishRecipe } from "./actions";
```

Inside the component, add state after existing state declarations:
```tsx
const [showPublishNudge, setShowPublishNudge] = useState(false);
const [nudgePublished, setNudgePublished] = useState(false);
const [nudgeLoading, setNudgeLoading] = useState(false);
```

**Step 3: Trigger nudge after cook is logged**

Find `handleCookSubmit`. Change it from:

```tsx
function handleCookSubmit(e: React.FormEvent) {
  e.preventDefault();
  startTransition(async () => {
    await logCook(recipeId, cookDate, cookNotes || null);
    setShowCookForm(false);
    setCookNotes("");
    setCookDate(new Date().toISOString().split("T")[0]);
  });
}
```

To:

```tsx
function handleCookSubmit(e: React.FormEvent) {
  e.preventDefault();
  startTransition(async () => {
    await logCook(recipeId, cookDate, cookNotes || null);
    setShowCookForm(false);
    setCookNotes("");
    setCookDate(new Date().toISOString().split("T")[0]);
    if (isPrivateManual) setShowPublishNudge(true);
  });
}
```

**Step 4: Add nudge UI**

After the cook form / "Cooked It" button block (after line ~180), add:

```tsx
{showPublishNudge && !nudgePublished && (
  <div className="mb-6 px-3 py-3 bg-surface border border-border">
    <p className="text-[12px] font-light text-ink-secondary mb-2">
      Logged — but this recipe is private. Publish it so your followers can see your cooking activity.
    </p>
    <div className="flex items-center gap-3">
      <button
        onClick={async () => {
          setNudgeLoading(true);
          const result = await publishRecipe(recipeId);
          if (!result?.error) setNudgePublished(true);
          setNudgeLoading(false);
        }}
        disabled={nudgeLoading}
        className="text-[11px] font-normal tracking-[0.02em] bg-ink text-bg px-3 py-1.5 hover:bg-ink/80 transition-colors disabled:opacity-50"
      >
        {nudgeLoading ? "Publishing..." : "Publish recipe"}
      </button>
      <button
        onClick={() => setShowPublishNudge(false)}
        className="text-[11px] font-normal tracking-[0.02em] text-ink-muted hover:text-ink transition-colors"
      >
        Not now
      </button>
    </div>
  </div>
)}
{showPublishNudge && nudgePublished && (
  <div className="mb-6 px-3 py-2.5 bg-olive/10 border border-olive/30">
    <p className="text-[12px] font-normal text-olive">
      Published — followers can now see your cooking activity.
    </p>
  </div>
)}
```

**Step 5: Pass `isPrivateManual` from `recipe-detail.tsx`**

Read `recipe-detail.tsx`. Find `<CookingLog recipeId={recipe.id} cookEntries={cookEntries} ratings={ratings} />` (around line 519).

Change to:
```tsx
<CookingLog
  recipeId={recipe.id}
  cookEntries={cookEntries}
  ratings={ratings}
  isPrivateManual={isOwner && recipe.visibility === "private" && (recipe.source_type === "manual" || recipe.source_type === "fork")}
/>
```

**Step 6: Commit**

```bash
git -C /Users/bart/claude/together-map add \
  src/app/(authenticated)/recipes/\[id\]/cooking-log.tsx \
  src/app/(authenticated)/recipes/\[id\]/recipe-detail.tsx
git -C /Users/bart/claude/together-map commit -m "feat: show publish nudge in cook log for private manual recipes"
```

---

### Task 6: Web own profile — published vs total recipe stat

**Files:**
- Modify: `src/app/(authenticated)/profile/page.tsx`

**Step 1: Compute published count**

Read the file. Find:
```tsx
const totalRecipes = (recipes || []).length;
```

After it, add:
```tsx
const publishedRecipes = (recipes || []).filter((r) => r.visibility === "public").length;
```

**Step 2: Update the Recipes stat cell**

Find the stats bar "Recipes" cell (around line 146):

```tsx
<Link href="/recipes" className="flex-1 py-2.5 text-center border-r border-border transition-colors hover:bg-accent-light">
  <div className="text-[26px] font-normal tracking-[-0.01em] text-ink">{totalRecipes}</div>
  <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Recipes</div>
</Link>
```

Change to:

```tsx
<Link href="/recipes" className="flex-1 py-2.5 text-center border-r border-border transition-colors hover:bg-accent-light">
  <div className="text-[26px] font-normal tracking-[-0.01em] text-ink">{publishedRecipes}</div>
  <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted">Published</div>
  {totalRecipes > publishedRecipes && (
    <div className="text-[10px] text-ink-muted/60">{totalRecipes} total</div>
  )}
</Link>
```

**Step 3: Commit**

```bash
git -C /Users/bart/claude/together-map add src/app/(authenticated)/profile/page.tsx
git -C /Users/bart/claude/together-map commit -m "feat: show published vs total recipes on own profile stats"
```

---

### Task 7: Mobile recipe detail — publish banner + fix fork toggle

**Files:**
- Modify: `mobile/app/recipe/[id]/index.tsx`

This file is large. Read the full file first. Look for:
1. The section where `isOwner` and `recipe.visibility` are used to conditionally render controls
2. The existing visibility toggle condition (`recipe.source_type === 'manual' && !recipe.forked_from_id`)
3. A good insertion point for the banner (after the stats bar, before the tags/ingredients section)

**Step 1: Add publish state variables**

Near the existing state declarations (look for `useState` calls at the top of `RecipeDetailScreen`), add:

```tsx
const [bannerPublished, setBannerPublished] = useState(false);
const [bannerLoading, setBannerLoading] = useState(false);
```

**Step 2: Add publish function**

Add a `handlePublish` function inside the component:

```tsx
const handlePublish = async () => {
  setBannerLoading(true);
  const { error } = await supabase
    .from('recipes')
    .update({ visibility: 'public', published_at: new Date().toISOString() })
    .eq('id', recipe.id)
    .eq('created_by', user!.id);
  setBannerLoading(false);
  if (!error) {
    setBannerPublished(true);
    setRecipe((prev: Recipe | null) => prev ? { ...prev, visibility: 'public' } : prev);
  }
};
```

Note: `setRecipe` may be called `setRecipeData` depending on what you find in the file. Use whatever the state setter is named.

**Step 3: Add publish banner JSX**

Find where the stats bar ends (look for the section after `prep_time_minutes`, `cook_time_minutes`, `servings` display). After the stats bar and before the tags/ingredients section, add for `isOwner && recipe.visibility === 'private'`:

```tsx
{isOwner && recipe.visibility === 'private' && !bannerPublished && (() => {
  const canPublish = recipe.source_type === 'manual' || recipe.source_type === 'fork';
  return (
    <View style={styles.publishBanner}>
      {canPublish ? (
        <>
          <Text style={styles.publishBannerText}>
            Your followers can&apos;t see when you cook this. Publish it to share with them.
          </Text>
          <Pressable
            style={[styles.publishButton, bannerLoading && styles.publishButtonDisabled]}
            onPress={handlePublish}
            disabled={bannerLoading}
          >
            <Text style={styles.publishButtonText}>
              {bannerLoading ? 'Publishing...' : 'Publish'}
            </Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.publishBannerText}>
          Saved to your private collection. Only you can see this.
        </Text>
      )}
    </View>
  );
})()}
{isOwner && recipe.visibility === 'private' && bannerPublished && (
  <View style={[styles.publishBanner, styles.publishBannerSuccess]}>
    <Text style={styles.publishBannerSuccessText}>
      Published — your followers can now see this recipe in their feed.
    </Text>
  </View>
)}
```

**Step 4: Add styles**

In the `StyleSheet.create({...})` at the bottom of the file, add:

```tsx
publishBanner: {
  marginHorizontal: spacing.lg,
  marginTop: spacing.md,
  padding: spacing.md,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
},
publishBannerText: {
  ...typography.bodySmall,
  color: colors.inkSecondary,
  marginBottom: spacing.sm,
},
publishButton: {
  backgroundColor: colors.ink,
  paddingVertical: 8,
  paddingHorizontal: 16,
  alignSelf: 'flex-start',
},
publishButtonDisabled: {
  opacity: 0.5,
},
publishButtonText: {
  ...typography.metaSmall,
  color: colors.bg,
},
publishBannerSuccess: {
  borderColor: colors.olive,
  backgroundColor: 'rgba(107, 114, 60, 0.08)',
},
publishBannerSuccessText: {
  ...typography.bodySmall,
  color: colors.olive,
},
```

Check `mobile/lib/theme.ts` to confirm `colors.olive` exists. If not, use `colors.accent` as fallback.

**Step 5: Fix fork toggle condition**

Find:
```tsx
{recipe.source_type === 'manual' && !recipe.forked_from_id && (
```

Change to:
```tsx
{(recipe.source_type === 'manual' || recipe.source_type === 'fork') && (
```

**Step 6: Commit**

```bash
git -C /Users/bart/claude/together-map add mobile/app/recipe/\[id\]/index.tsx
git -C /Users/bart/claude/together-map commit -m "feat: add publish banner to mobile recipe detail, fix fork toggle"
```

---

### Task 8: Mobile recipe list — lock indicator + inline publish

**Files:**
- Modify: `mobile/app/(tabs)/recipes.tsx`

Read the full file first. Find where individual recipe items are rendered (look for `renderItem` or the FlatList render function). Find the meta row that shows time and tags.

**Step 1: Add publish state map**

In the component, after existing state declarations, add:
```tsx
const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
const [publishingId, setPublishingId] = useState<string | null>(null);
```

**Step 2: Add publish handler**

```tsx
const handlePublishRecipe = async (recipeId: string) => {
  setPublishingId(recipeId);
  const { error } = await supabase
    .from('recipes')
    .update({ visibility: 'public', published_at: new Date().toISOString() })
    .eq('id', recipeId)
    .eq('created_by', user!.id);
  setPublishingId(null);
  if (!error) {
    setPublishedIds((prev) => new Set(prev).add(recipeId));
  }
};
```

**Step 3: Add lock indicator + publish button to recipe item**

In the recipe item render, find the meta row (the row showing time/rating/tags). After that row, add conditionally for private recipes:

```tsx
{recipe.visibility === 'private' && !recipe.isSaved && (
  <View style={styles.privateRow}>
    {publishedIds.has(recipe.id) ? (
      <Text style={styles.publishedLabel}>Published</Text>
    ) : (
      <>
        <Text style={styles.privateLabel}>Private</Text>
        {(recipe.source_type === 'manual' || recipe.source_type === 'fork') && (
          <>
            <Text style={styles.privateDot}> · </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                handlePublishRecipe(recipe.id);
              }}
              disabled={publishingId === recipe.id}
            >
              <Text style={[styles.publishLink, publishingId === recipe.id && styles.publishLinkDisabled]}>
                {publishingId === recipe.id ? '...' : 'Publish'}
              </Text>
            </Pressable>
          </>
        )}
      </>
    )}
  </View>
)}
```

**Step 4: Add styles**

```tsx
privateRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 2,
},
privateLabel: {
  ...typography.metaSmall,
  color: colors.inkMuted,
  opacity: 0.6,
},
privateDot: {
  ...typography.metaSmall,
  color: colors.inkMuted,
  opacity: 0.4,
},
publishLink: {
  ...typography.metaSmall,
  color: colors.accent,
},
publishLinkDisabled: {
  opacity: 0.5,
},
publishedLabel: {
  ...typography.metaSmall,
  color: colors.olive ?? colors.accent,
},
```

**Step 5: Commit**

```bash
git -C /Users/bart/claude/together-map add mobile/app/\(tabs\)/recipes.tsx
git -C /Users/bart/claude/together-map commit -m "feat: add lock indicator and inline publish to mobile recipe list"
```

---

### Task 9: Mobile import flow — private collection notice

**Files:**
- Modify: `mobile/app/recipe/import-url.tsx`

Read the file. Find where the recipe form is shown after import (when `importedData` is set). Add a notice above the form, following the same pattern as the web version.

```tsx
<View style={styles.privateNotice}>
  <Text style={styles.privateNoticeText}>
    This will be saved to your private collection. Only you can see it.
  </Text>
</View>
```

Add to styles:
```tsx
privateNotice: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.md,
  marginBottom: spacing.md,
},
privateNoticeText: {
  ...typography.bodySmall,
  color: colors.inkSecondary,
  flex: 1,
},
```

**Commit:**
```bash
git -C /Users/bart/claude/together-map add mobile/app/recipe/import-url.tsx
git -C /Users/bart/claude/together-map commit -m "feat: show private collection notice on mobile import flow"
```

---

### Task 10: Mobile own profile — published vs total stat

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx`

Read the full file. The component already has `stats: { recipes: 0, published: 0, ... }` in state. Check if `stats.published` is populated in the data-fetch function. If not, find where stats are fetched and compute published count.

**Step 1: Verify `stats.published` is populated**

Search the file for where `setStats(` is called. Check if `published` is included. If the fetch uses an RPC, check what it returns. If `published` is not populated, add a count query:

```tsx
const { count: pubCount } = await supabase
  .from('recipes')
  .select('id', { count: 'exact', head: true })
  .eq('created_by', user.id)
  .eq('visibility', 'public');
```

And include `published: pubCount ?? 0` in `setStats`.

**Step 2: Find the stats bar render**

Find the stats bar showing "Recipes", "Cooked", "Followers", "Following". The "Recipes" stat currently shows `stats.recipes` (total). Update it to show `stats.published` as the primary number with a sub-label:

```tsx
<View style={styles.stat}>
  <Text style={styles.statValue}>{stats.published}</Text>
  <Text style={styles.statLabel}>Published</Text>
  {stats.recipes > stats.published && (
    <Text style={styles.statSubLabel}>{stats.recipes} total</Text>
  )}
</View>
```

Add to styles:
```tsx
statSubLabel: {
  ...typography.metaSmall,
  color: colors.inkMuted,
  opacity: 0.6,
  fontSize: 10,
},
```

**Step 3: Commit**

```bash
git -C /Users/bart/claude/together-map add mobile/app/\(tabs\)/profile.tsx
git -C /Users/bart/claude/together-map commit -m "feat: show published vs total on mobile own profile stats"
```

---

## Final verification checklist

After all tasks are complete, manually verify:

- [ ] Web recipe detail: private manual recipe shows publish banner with correct copy
- [ ] Web recipe detail: private imported recipe shows informational banner (no publish button)
- [ ] Web recipe detail: clicking Publish swaps to green confirmation, page reflects new state
- [ ] Web recipe detail: fork toggle condition fixed (verify in code, no forks to test against)
- [ ] Web recipe list: private manual recipe shows lock + "Private · Publish" in meta
- [ ] Web recipe list: private imported recipe shows lock + "Private" (no Publish)
- [ ] Web recipe list: clicking Publish inline works without navigating away
- [ ] Web import flow: "private collection" notice appears when form is shown
- [ ] Web cook log: logging a cook on private manual recipe shows publish nudge
- [ ] Web own profile: stats bar shows "Published" count with "X total" sub-note
- [ ] Mobile recipe detail: publish banner appears and functions correctly
- [ ] Mobile recipe list: lock indicator and publish action work
- [ ] Mobile import: private collection notice shows
- [ ] Mobile profile: published count shown correctly
