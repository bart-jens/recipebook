## Context

Users currently organize recipes via tags and search. Collections add a higher-level grouping: named, ordered sets of recipes. This is a standard pattern (playlists, shelves, boards). The free/premium split gives this a monetization angle.

## Goals / Non-Goals

**Goals:**
- Create, rename, delete collections
- Add/remove any recipe from the user's collection (owned or saved) to collections
- A recipe can belong to multiple collections
- Collection list view and collection detail view on web and mobile
- Free tier: max 5 collections. Premium: unlimited.
- Optional cover image (auto-selected from first recipe with an image, or manual upload)

**Non-Goals:**
- Shared/collaborative collections (that's the Groups feature, separate change)
- Public collections visible to other users (future — could be a creator feature)
- Smart/auto-generated collections (e.g., "Most cooked", "Uncooked imports")
- Ordering recipes within a collection (insertion order for now)

## Decisions

### 1. Data model: two tables

**Decision:** `collections` table + `collection_recipes` junction table.

```
collections
├── id (uuid PK)
├── user_id (uuid FK → auth.users, NOT NULL)
├── name (text, NOT NULL)
├── description (text, nullable)
├── cover_image_url (text, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)

collection_recipes
├── id (uuid PK)
├── collection_id (uuid FK → collections, ON DELETE CASCADE)
├── recipe_id (uuid FK → recipes, ON DELETE CASCADE)
├── added_at (timestamptz, default now())
└── UNIQUE (collection_id, recipe_id)
```

**Rationale:** Standard junction table pattern. CASCADE on both FKs: deleting a collection removes memberships, deleting a recipe removes it from all collections. No ordering column for now (sort by added_at).

### 2. Free tier enforcement: client + DB

**Decision:** Enforce 5-collection limit at both client (disable create button, show upgrade prompt) and database (RLS policy or trigger that checks count).

**Rationale:** Client-only enforcement is bypassable. DB-level enforcement ensures consistency. Using a trigger rather than RLS because RLS can't easily do count-based checks.

```sql
CREATE OR REPLACE FUNCTION check_collection_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT plan FROM user_profiles WHERE id = NEW.user_id) = 'free'
     AND (SELECT COUNT(*) FROM collections WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Free plan limited to 5 collections';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Cover image: auto-select with manual override

**Decision:** Default cover image is the primary image of the first recipe in the collection (by added_at). User can override by uploading a custom image. Stored as `cover_image_url` on the collections table.

**Rationale:** Auto-selecting avoids empty collection cards. Manual override gives control. The URL can point to either recipe images or a separately uploaded image.

### 4. RLS: owner-only

**Decision:** Collections and collection_recipes are fully private to the owner. No public visibility.

**Rationale:** Collections are a personal organization tool for now. Public/shared collections come with the Groups feature later. Owner-only RLS is simple and restrictive by default.

## Risks / Trade-offs

**[Collection count query on every insert]** → The trigger fires on every collection insert. At current scale, negligible. At scale, could cache the count on user_profiles.

**[No ordering within collections]** → Users can't reorder recipes in a collection. Using `added_at` order. If users need custom ordering, add an `order_index` column later.

**[Cover image on recipe deletion]** → If the recipe providing the cover image is deleted, `cover_image_url` could point to an orphaned storage path. Mitigated by falling back to next recipe's image in UI if cover URL fails to load.
