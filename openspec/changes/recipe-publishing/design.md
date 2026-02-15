## Context

EefEats currently stores recipes as private-by-default personal recipes. There is no concept of public/canonical recipes or a discovery page. The social-platform spec defines the data model additions (visibility, published_at, forked_from_id), and user-profiles provides creator identity. This change implements the publish flow and discovery experience on top of that foundation.

**Dependencies:**
- user-profiles change must ship first (creator display name + avatar on recipe cards)
- Recipes table and RLS exist from the project foundation

**Current state:**
- `recipes` table has no visibility column (all recipes are implicitly private)
- No discovery page exists
- Recipe detail shows owner info but no public creator attribution
- Mobile Discover tab exists as a placeholder

## Goals / Non-Goals

**Goals:**
- Add visibility, published_at, and forked_from_id columns to recipes
- Publish/unpublish flow with confirmation dialog
- Discovery page with search, tag filter, and multiple sort options
- Recipe cards showing title, image, creator, aggregate rating, tags
- Creator attribution on public recipe detail pages
- Free tier publish limit enforcement (10 recipes)
- RLS policies for public recipe visibility
- Works on both web and mobile

**Non-Goals:**
- Forking (separate change — just adding forked_from_id column now for schema readiness)
- Subscribers-only recipes (future, with creator system)
- Sponsored recipes and placement (future monetization)
- Recipe analytics / view tracking (future)
- Full-text search (title ILIKE is sufficient for now, can add pg_trgm later)

## Decisions

### 1. Schema Migration: Add Columns to Existing `recipes` Table

**Decision:** Add `visibility`, `published_at`, and `forked_from_id` as new columns to the existing `recipes` table. Default visibility = 'private' so existing recipes are unaffected.

**Schema changes:**
```sql
alter table recipes
  add column visibility text not null default 'private'
    check (visibility in ('private', 'public', 'subscribers')),
  add column published_at timestamptz,
  add column forked_from_id uuid references recipes(id) on delete set null;
```

**Rationale:**
- No data migration needed (all existing recipes default to 'private')
- `forked_from_id` added now to avoid a second migration later
- `ON DELETE SET NULL` for forked_from_id: if original is deleted, fork keeps working but loses attribution

**Alternatives considered:**
- Separate `canonical_recipes` table: Rejected — duplicates schema, complicates queries
- Enum type for visibility: Rejected — text with CHECK is simpler and more portable

### 2. Discovery Query Strategy: ILIKE + Indexed Columns

**Decision:** Use `ILIKE` for title search and standard column indexes for filtering/sorting. No full-text search or trigram indexes for now.

**Discovery query pattern:**
```sql
select r.*, up.display_name, up.avatar_url,
  coalesce(avg(rr.rating), 0) as avg_rating,
  count(rr.id) as rating_count
from recipes r
join user_profiles up on r.created_by = up.id
left join recipe_ratings rr on r.id = rr.recipe_id
where r.visibility = 'public'
  and (r.title ilike '%search%' or 'search' = '')
  and (exists (select 1 from recipe_tags rt where rt.recipe_id = r.id and rt.tag = any($tags)) or $tags is null)
group by r.id, up.id
order by <sort_column> desc
limit 20 offset $offset;
```

**Indexes:**
```sql
create index idx_recipes_visibility on recipes(visibility) where visibility = 'public';
create index idx_recipes_published_at on recipes(published_at) where visibility = 'public';
```

**Rationale:**
- Simple and sufficient for current scale (invite-only, hundreds of recipes)
- ILIKE with `%` prefix won't use indexes, but acceptable at current scale
- Can upgrade to pg_trgm or full-text search when performance becomes an issue

### 3. Publish Flow: Optimistic with Confirmation

**Decision:** Publish is a client-side update of `visibility` + `published_at` with a confirmation dialog. No approval queue or moderation (invite-only = trusted users).

**Flow:**
1. User taps "Publish" on their private recipe
2. Confirmation dialog: "Publishing will make this recipe visible to everyone. Continue?"
3. On confirm: UPDATE recipes SET visibility = 'public', published_at = now()
4. Success toast: "Recipe published!"
5. Recipe now appears in discovery

**Unpublish flow:**
1. User taps "Unpublish" on their public recipe
2. Confirmation: "This will remove the recipe from public discovery. Continue?"
3. On confirm: UPDATE recipes SET visibility = 'private', published_at = null
4. Existing forks (future) keep their copy but lose attribution link

**Rationale:**
- Simple, low-friction flow
- No moderation needed (invite-only)
- Can add moderation queue when opening signups

### 4. Free Tier Publish Limit: Client + Server Enforcement

**Decision:** Enforce the 10-recipe publish limit at both client (UI hint) and server (RLS) levels.

**Client-side:**
- Query count of user's public recipes
- Show "X/10 published" counter near publish button
- Disable publish button when at limit with "Upgrade to Premium for unlimited publishing"

**Server-side (RLS):**
```sql
-- Allow publishing only if under limit or premium
create policy "recipes_publish_limit" on recipes
  for update using (
    auth.uid() = created_by
    and (
      -- Not changing to public (allow all other updates)
      new.visibility != 'public'
      -- Or already public (allow edits to published recipes)
      or old.visibility = 'public'
      -- Or premium user
      or exists (select 1 from user_profiles where id = auth.uid() and plan = 'premium')
      -- Or under limit
      or (select count(*) from recipes where created_by = auth.uid() and visibility = 'public') < 10
    )
  );
```

Note: This RLS approach requires careful implementation since `new`/`old` aren't directly available in RLS policies. The actual enforcement may need a trigger or application-level check.

**Rationale:**
- Dual enforcement prevents bypassing
- Clear messaging guides free users toward premium
- 10 is generous enough to not frustrate casual users

**Alternatives considered:**
- Server-only enforcement: Rejected — poor UX (no feedback until error)
- Application-only: Rejected — bypassable via direct API calls

### 5. Sort Options for Discovery

**Decision:** Offer 3 sort options: Newest (published_at desc), Highest Rated (avg_rating desc), and Most Popular (rating_count desc).

**Rationale:**
- Covers the main discovery use cases
- "Most Popular" by rating count is a simple proxy for engagement
- No "trending" for now (would need time-windowed queries, not worth the complexity yet)
- Can add "Most Forked" sort when forking ships

### 6. Recipe Card Component

**Decision:** Shared recipe card component used across discovery, profile pages, and search results.

**Card shows:**
- Recipe image (primary image, or placeholder)
- Title
- Creator name + avatar (small, linked to profile)
- Aggregate rating (stars + count)
- Tags (first 2-3, overflow hidden)
- Cook time (if set)

**Rationale:**
- Consistent presentation across all contexts
- Reusable component saves effort across web + mobile
- Shows enough info to decide whether to tap/click

## Risks / Trade-offs

### [Risk] ILIKE search performance at scale
**Mitigation:** Acceptable for invite-only scale. When approaching 10k+ public recipes, add pg_trgm extension and GIN index. The query pattern stays the same, just gets index support.

### [Risk] Publish limit RLS complexity
**Mitigation:** If RLS-level enforcement proves too complex (new/old row access), fall back to a BEFORE UPDATE trigger that raises an exception. Client-side enforcement handles 99% of cases anyway.

### [Risk] Aggregate rating queries slow on discovery page
**Mitigation:** Use LEFT JOIN with GROUP BY for now. If slow, add a materialized view or denormalized `avg_rating`/`rating_count` columns on recipes table (refreshed by trigger).

### [Trade-off] No moderation on publishing
**Accepted:** Invite-only means trusted users. When opening signups, will need content moderation (flagging, review queue, auto-hide).

### [Trade-off] forked_from_id added but unused
**Accepted:** Adding the column now avoids a schema migration when forking ships. Column is nullable and has no impact on existing queries.

## Migration Plan

**Phase 1: Database**
1. Add visibility, published_at, forked_from_id columns to recipes
2. Add partial indexes for discovery queries
3. Update RLS policies for public recipe read access
4. Add publish limit enforcement (trigger or application-level)

**Phase 2: Web**
1. Discovery page with search, filter, sort
2. Recipe card component
3. Publish/unpublish button on recipe detail
4. Creator attribution on public recipe detail
5. Publish limit indicator

**Phase 3: Mobile**
1. Discover tab content (replace placeholder)
2. Recipe card component for mobile
3. Publish action on recipe detail
4. Creator attribution

**Rollback:**
- Drop new columns (or set all visibility = 'private')
- Remove discovery page routes
- All existing functionality unaffected
