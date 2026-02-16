## Context

EefEats currently stores recipes as private-by-default personal recipes. There is no concept of public/canonical recipes, no discovery page, and no way to share imported recipes socially. The social-platform spec defines the data model foundations (visibility, follows, profiles). This change implements two sharing paths on top:

1. **Publishing** — for original recipes (source_type = 'manual'), using the visibility column
2. **Sharing** — for imported recipes (URL, Instagram, photo), using a separate recommendation card system

This dual approach exists to protect creator IP: imported recipe instructions are copyrighted content that shouldn't be republished. The social layer for imported recipes is built on the user's own commentary, ratings, and photos.

**Dependencies:**
- user-profiles change must ship first (creator display name + avatar on cards)
- Recipes table, RLS, and social data model exist from prior changes

## Goals / Non-Goals

**Goals:**
- Publish/unpublish flow for original recipes with confirmation
- Discovery page with search, tag filter, sort (Newest/Highest Rated/Most Popular)
- Recipe cards showing image, title, creator, rating, tags
- Creator attribution on public recipe detail pages
- Free tier publish limit (10 recipes) with server enforcement
- Imported recipes blocked from publishing via database CHECK constraint
- Share flow for imported recipes creating recommendation cards
- Recommendation cards showing title, source, rating, user notes, user photos
- Source name extraction (domain mapping for URLs, handle for Instagram, manual for books)
- User photo uploads with priority over source thumbnails in carousel
- "Save to my recipes" from recommendation cards
- Works on both web and mobile

**Non-Goals:**
- Forking (separate change — adding forked_from_id column now for schema readiness)
- Subscribers-only recipes (future, with creator system)
- Sponsored recipes and placement (future)
- Full-text search (title ILIKE sufficient for now)
- Content moderation (invite-only = trusted users)
- DMCA takedown flow (premature at current scale)
- Recipe deduplication (two users importing same URL = two independent copies)

## Decisions

### 1. Schema: Add visibility columns to existing recipes table

**Decision:** Add `visibility`, `published_at`, `forked_from_id`, and `source_name` as new columns to the existing `recipes` table. Default visibility = 'private' so existing recipes are unaffected.

```sql
alter table recipes
  add column visibility text not null default 'private'
    check (visibility in ('private', 'public', 'subscribers')),
  add column published_at timestamptz,
  add column forked_from_id uuid references recipes(id) on delete set null,
  add column source_name text;
```

Plus a CHECK constraint preventing imported recipes from going public:
```sql
alter table recipes
  add constraint imported_recipes_stay_private
    check (source_type = 'manual' or visibility = 'private');
```

**Rationale:** No data migration needed. `forked_from_id` added now to avoid a second migration. CHECK constraint enforces IP protection at the database level.

### 2. Separate recipe_shares table for imported recipe sharing

**Decision:** Create a `recipe_shares` table rather than overloading the visibility column.

The `visibility` column controls full content access via RLS — public means everything is readable. For imported recipes we need the opposite: share metadata but keep content private. A separate table cleanly separates these concerns.

```sql
create table recipe_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  notes text,
  shared_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);
```

**Alternative considered:** Adding `shared_at` + `share_notes` columns to recipes with a security definer function to return card data. Rejected — mixes two access patterns, requires function-based queries that don't compose well with Supabase client.

### 3. recipe_share_cards view for social feed

**Decision:** Create a database view that joins recipe_shares with only safe (non-copyrightable) recipe columns.

The view exposes: share id, user_id, recipe_id, share notes, shared_at, recipe title, source_url, source_name, source_type, image_url, and tags. It does NOT expose: instructions, description, or ingredient data.

**Rationale:** Views work natively with Supabase client. No security definer needed. Column restriction happens at the view level, not RLS.

### 4. Discovery query: ILIKE + indexed columns

**Decision:** Use `ILIKE` for title search and standard column indexes. No full-text search or trigram indexes for now.

**Indexes:**
```sql
create index idx_recipes_visibility on recipes(visibility) where visibility = 'public';
create index idx_recipes_published_at on recipes(published_at) where visibility = 'public';
```

**Rationale:** Simple and sufficient at invite-only scale (hundreds of recipes). Can upgrade to pg_trgm when approaching 10k+ recipes.

### 5. Publish limit: client + server enforcement

**Decision:** Enforce the 10-recipe free tier limit at both UI (counter + disabled button) and server (BEFORE UPDATE trigger that rejects publishing above limit for free users).

Using a trigger rather than RLS because RLS doesn't have access to `OLD`/`NEW` row values for checking state transitions.

### 6. Sort options for discovery

**Decision:** 3 sort options: Newest (published_at desc), Highest Rated (avg_rating desc), Most Popular (rating_count desc).

### 7. User photos: image_type column on existing recipe_images table

**Decision:** Add `image_type` column ('source' or 'user_upload') to recipe_images. Carousel orders user photos first, source thumbnails last. Primary image (recipes.image_url) set to first user-uploaded photo when available.

### 8. Source name extraction

**Decision:** Derive automatically where possible, prompt for manual input on photo imports.
- URL import: domain-to-name mapping (seriouseats.com → "Serious Eats"), raw domain fallback
- Instagram: handle when available, "Instagram" fallback
- Photo/book: prompt user + optional book cover scan via Gemini Vision
- Manual entry: null (it's original content)

### 9. "Save to my recipes" flow

**Decision:** Re-import from source URL when available, copy metadata only when URL is dead.
- Live source URL → standard URL import flow
- Dead source URL → copy title + ingredients with attribution, no instructions
- No source URL (book) → copy title + source_name only, no content

This avoids ever copying copyrighted instruction text between users.

## Risks / Trade-offs

**[Risk] ILIKE search performance at scale** → Acceptable for invite-only. Add pg_trgm GIN index when needed.

**[Risk] Publish limit trigger complexity** → Trigger is straightforward. Client-side enforcement handles 99% of cases anyway.

**[Risk] Aggregate rating queries slow on discovery** → LEFT JOIN + GROUP BY for now. Add materialized view or denormalized columns if slow.

**[Risk] Source URLs rot** → Accepted. Private copy persists. "Save to my recipes" degrades gracefully.

**[Trade-off] No moderation** → Invite-only = trusted users. Add moderation when opening signups.

**[Trade-off] forked_from_id added but unused** → Avoids a schema migration when forking ships.

**[Trade-off] Card view excludes description** → Description sometimes contains creative prose. Safer to omit from public card. Title + source + tags is enough to decide.

## Migration Plan

**Phase 1: Database**
1. Add visibility, published_at, forked_from_id, source_name to recipes
2. Add CHECK constraint for imported recipe visibility
3. Add image_type to recipe_images, backfill existing to 'source'
4. Create recipe_shares table with RLS
5. Create recipe_share_cards view
6. Add indexes for discovery and feed queries
7. Add publish limit trigger
8. Update RLS for public recipe access and ratings
9. Backfill source_name on existing imported recipes from source_url domain

**Phase 2: Web**
1. Source name extraction in import flows
2. Source attribution display on recipe detail
3. Discovery page with search, filter, sort
4. Recipe card component
5. Publish/unpublish for originals
6. Share/unshare for imports
7. Recommendation card component
8. "Save to my recipes" flow
9. Photo carousel

**Phase 3: Mobile**
1. Source name extraction and prompts
2. Source attribution display
3. Discover tab content
4. Recipe cards
5. Publish/share actions
6. Recommendation cards
7. Photo carousel and book cover scan

**Rollback:** Drop new tables/views/columns. All existing functionality unaffected.
