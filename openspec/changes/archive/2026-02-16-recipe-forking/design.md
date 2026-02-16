## Context

The recipes table already has `forked_from_id` (uuid FK, ON DELETE SET NULL) and `recipe_analytics` tracks fork events. The social-platform spec defines forking behavior at a high level. This change builds the actual fork flow and UI.

A fork is a deep copy: recipe row + all ingredients + all tags. Images are referenced (not copied) since they're in shared storage. The forked recipe is private and fully editable.

## Goals / Non-Goals

**Goals:**
- One-tap fork from any public recipe detail page
- Full deep copy (recipe + ingredients + tags) as a private recipe
- Clear attribution back to original recipe and creator
- Fork count displayed on public recipe cards
- Fork event logged in recipe_analytics

**Non-Goals:**
- Syncing forks with upstream changes (forks are independent after creation)
- Forking subscribers-only recipes (requires active subscription — future)
- Merge/diff between fork and original
- Publishing a fork as a new canonical recipe (future consideration)

## Decisions

### 1. Fork as server-side operation

**Decision:** Fork is a single API call that creates the recipe + ingredients + tags in a transaction.

**Rationale:** Client-side would require multiple sequential inserts with partial failure risk. A server-side function (Supabase RPC or API route) ensures atomicity. Using an API route (`/api/recipes/fork`) since it needs to copy across multiple tables.

**Alternative considered:** Supabase RPC function. Rejected because the image copying logic may need Node.js runtime access, and API routes are the established pattern for mobile compatibility.

### 2. Image handling on fork

**Decision:** Copy the `image_url` reference. Don't duplicate image files in storage.

**Rationale:** Images are stored in Supabase Storage with public URLs. The fork can reference the same image. If the original is deleted, the image persists in storage (orphaned but functional). If the fork owner wants a different image, they upload their own.

### 3. Fork count as a derived count

**Decision:** Use `SELECT COUNT(*) FROM recipes WHERE forked_from_id = ?` for fork count. No denormalized counter.

**Rationale:** At current scale, this count query is trivial. The `recipes_forked_from_idx` index already exists. Denormalized counters add consistency complexity. Can add a materialized counter later if needed.

### 4. Source type for forked recipes

**Decision:** Forked recipes get `source_type = 'fork'`. This means they can be published later (they're not imports). The `source_url` is not set — attribution is via `forked_from_id`.

**Rationale:** A fork of someone's original recipe is itself an original derivative work. The user may modify it substantially. It should be publishable. Adding 'fork' to the source_type CHECK constraint makes this explicit.

## Risks / Trade-offs

**[Original deleted after fork]** → `ON DELETE SET NULL` on `forked_from_id` handles this gracefully. Fork continues to work, attribution shows "Original recipe no longer available."

**[Fork spam]** → At invite scale, not a concern. At open scale, could add rate limiting or require the recipe to be saved first.

**[source_type CHECK constraint change]** → Adding 'fork' to the existing CHECK requires an ALTER. Low risk, additive change.
