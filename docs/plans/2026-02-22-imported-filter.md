# Imported Filter Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "Imported" filter tab to the My Recipes screen on both mobile and web, and reorder all tabs to: All → Imported → Published → Saved → Favorited.

**Architecture:** `source_type` already exists on every recipe row. The filter is client-side on both platforms — just a new branch in the existing `useMemo` / filter logic. No DB changes. The `source_type` field needs to be added to the fetch query on both platforms (it isn't currently selected). Filter condition: `source_type NOT IN ('manual', 'fork')` — safely excludes your own originals and forks; saved recipes from others are always `manual` or `fork` due to the DB CHECK constraint preventing imported recipes from going public.

**Tech Stack:** React Native (mobile), Next.js 14 App Router (web), Supabase, TypeScript

---

### Task 1: Mobile — add Imported filter tab

**Files:**
- Modify: `mobile/app/(tabs)/recipes.tsx`

**Step 1: Update `FilterOption` type**

Find:
```typescript
type FilterOption = '' | 'favorited' | 'saved' | 'published';
```
Replace with:
```typescript
type FilterOption = '' | 'imported' | 'published' | 'saved' | 'favorited';
```

**Step 2: Update `FILTER_OPTIONS` array**

Find:
```typescript
const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'favorited', label: 'Favorited' },
  { value: 'saved', label: 'Saved' },
  { value: 'published', label: 'Published' },
];
```
Replace with (new order: All → Imported → Published → Saved → Favorited):
```typescript
const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'imported', label: 'Imported' },
  { value: 'published', label: 'Published' },
  { value: 'saved', label: 'Saved' },
  { value: 'favorited', label: 'Favorited' },
];
```

**Step 3: Add `source_type` to the `Recipe` interface**

Find the `interface Recipe {` block. Add `source_type: string;` alongside the other string fields:
```typescript
interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  updated_at: string;
  visibility: string;
  source_type: string;         // ← add this
  avgRating: number | null;
  ratingCount: number;
  tags: string[];
  isFavorited: boolean;
  hasCooked: boolean;
  isSaved: boolean;
}
```

**Step 4: Add `source_type` to the Supabase select query**

Find:
```typescript
const selectFields = 'id, title, description, image_url, prep_time_minutes, cook_time_minutes, updated_at, visibility, recipe_tags(tag)';
```
Replace with:
```typescript
const selectFields = 'id, title, description, image_url, prep_time_minutes, cook_time_minutes, updated_at, visibility, source_type, recipe_tags(tag)';
```

**Step 5: Add the `imported` filter case in the `useMemo`**

Find the filter block in `useMemo`:
```typescript
  if (activeFilter === 'favorited') {
    filtered = filtered.filter((r) => r.isFavorited);
  } else if (activeFilter === 'saved') {
    filtered = filtered.filter((r) => r.isSaved);
  } else if (activeFilter === 'published') {
    filtered = filtered.filter((r) => r.visibility === 'public' && !r.isSaved);
  }
```
Replace with:
```typescript
  if (activeFilter === 'imported') {
    filtered = filtered.filter((r) => !['manual', 'fork'].includes(r.source_type));
  } else if (activeFilter === 'published') {
    filtered = filtered.filter((r) => r.visibility === 'public' && !r.isSaved);
  } else if (activeFilter === 'saved') {
    filtered = filtered.filter((r) => r.isSaved);
  } else if (activeFilter === 'favorited') {
    filtered = filtered.filter((r) => r.isFavorited);
  }
```

**Step 6: Verify manually**

Open the Recipes tab. Confirm:
- Tabs appear in order: All / Imported / Published / Saved / Favorited
- Tapping "Imported" shows only URL-imported, photo-imported, and Instagram-imported recipes
- Tapping "All" shows everything again
- Other filters still work

**Step 7: Commit**

```bash
git add mobile/app/(tabs)/recipes.tsx
git commit -m "feat: add Imported filter tab to mobile recipes screen"
```

---

### Task 2: Web — add Imported filter tab

**Files:**
- Modify: `src/app/(authenticated)/recipes/page.tsx`
- Modify: `src/app/(authenticated)/recipes/recipe-list-controls.tsx`

**Step 1: Read both files first**

Read `src/app/(authenticated)/recipes/page.tsx` to find:
- The `Recipe` type definition
- The `selectFields` / Supabase query (check if `source_type` is already selected)
- The filter logic block (the if/else chain that filters by `filter === "favorited"` etc.)

Read `src/app/(authenticated)/recipes/recipe-list-controls.tsx` to find:
- The `FILTER_OPTIONS` array

**Step 2: Add `source_type` to the Recipe type (if not present)**

In `page.tsx`, find the local `Recipe` type or interface. Add:
```typescript
source_type: string;
```

**Step 3: Add `source_type` to the Supabase select string (if not present)**

Find the select string in the fetch query. If `source_type` is not already included, add it alongside `visibility` and other scalar fields:
```
source_type,
```

**Step 4: Add the `imported` filter case**

In `page.tsx`, find the filter logic block:
```typescript
if (filter === "favorited") {
  filtered = filtered.filter((r) => r.isFavorited);
} else if (filter === "saved") {
  filtered = filtered.filter((r) => r.isSaved);
} else if (filter === "published") {
  filtered = filtered.filter((r) => r.visibility === "public" && !r.isSaved);
}
```
Replace with:
```typescript
if (filter === "imported") {
  filtered = filtered.filter((r) => !["manual", "fork"].includes(r.source_type));
} else if (filter === "published") {
  filtered = filtered.filter((r) => r.visibility === "public" && !r.isSaved);
} else if (filter === "saved") {
  filtered = filtered.filter((r) => r.isSaved);
} else if (filter === "favorited") {
  filtered = filtered.filter((r) => r.isFavorited);
}
```

**Step 5: Update `FILTER_OPTIONS` in `recipe-list-controls.tsx`**

Find:
```typescript
const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "favorited", label: "Favorited" },
  { value: "saved", label: "Saved" },
  { value: "published", label: "Published" },
];
```
Replace with:
```typescript
const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "imported", label: "Imported" },
  { value: "published", label: "Published" },
  { value: "saved", label: "Saved" },
  { value: "favorited", label: "Favorited" },
];
```

**Step 6: Verify manually**

Navigate to `/recipes` in the web app. Confirm:
- Filter tabs appear in order: All / Imported / Published / Saved / Favorited
- Clicking "Imported" shows only URL/photo/Instagram-imported recipes
- URL param updates to `?filter=imported`
- Other filters still work

**Step 7: Commit**

```bash
git add src/app/(authenticated)/recipes/page.tsx src/app/(authenticated)/recipes/recipe-list-controls.tsx
git commit -m "feat: add Imported filter tab to web recipes page"
```
