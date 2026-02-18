## Context

EefEats is a kitchen-first recipe platform. Users browse recipes, decide what to cook, then need to buy ingredients. Currently there's no bridge between "I want to cook this" and "what do I need to buy?" — users fall back to screenshots or note-taking apps. The `recipe_ingredients` table already stores structured ingredient data (quantity, unit, ingredient_name, notes), which gives us a clean foundation for auto-generating shopping lists.

Existing data model: recipes have `recipe_ingredients` rows with `quantity` (decimal), `unit` (text), `ingredient_name` (text), `notes` (text), and `order_index`. This structured data makes ingredient merging feasible.

## Goals / Non-Goals

**Goals:**
- Users can add all ingredients from a recipe to their shopping list in one tap
- Ingredients from multiple recipes merge intelligently (same ingredient + compatible unit = summed quantity)
- Check-off UI works well in a grocery store (one-handed, big targets, offline-resilient)
- Free users get a single active shopping list; premium gets multiple named lists
- Available on both web and mobile with feature parity

**Non-Goals:**
- Aisle/category sorting (no ingredient taxonomy yet — save for later)
- Price tracking or store integration
- Auto-suggesting missing pantry staples
- Sharing lists with other users (later, with Groups feature)
- Offline sync (local-first) — the list should work with normal connectivity; offline caching is a separate change

## Decisions

### Decision 1: Flat list vs. recipe-grouped list

**Chosen: Flat list with recipe attribution**

Items are stored in a single flat list per shopping list, not grouped by recipe. Each item tracks which recipe(s) it came from (for traceability), but the UI displays a flat, check-off-able list. This matches how people actually shop — by ingredient, not by recipe.

*Alternative considered:* Recipe-grouped sections. Rejected because shoppers scan by ingredient aisle, not by meal.

### Decision 2: Ingredient merging strategy

**Chosen: Merge on add, with same-unit gating**

When adding a recipe's ingredients, the system checks each incoming ingredient against existing list items. If `ingredient_name` matches (case-insensitive, trimmed) AND `unit` matches, quantities are summed. If units differ (e.g., "cups" vs "g"), they stay as separate line items — no unit conversion at this stage.

The merge happens via a Supabase RPC function (`add_recipe_to_shopping_list`) that handles the upsert logic server-side. This avoids race conditions and keeps the merge atomic.

*Alternative considered:* Client-side merge with conflict UI. Rejected — too complex for v1, and the server-side approach is simpler and more reliable.

### Decision 3: Data model — single table vs. list + items

**Chosen: Two tables — `shopping_lists` + `shopping_list_items`**

`shopping_lists` holds the list metadata (name, user). `shopping_list_items` holds individual items. This naturally supports multiple named lists for premium users and keeps the schema clean for future features (shared lists with Groups).

Each item stores: `ingredient_name`, `quantity`, `unit`, `is_checked`, and a `recipe_ids` array (uuid[]) to track which recipes contributed to this item. Manual items have an empty recipe_ids array.

### Decision 4: Manual items

**Chosen: Allow manually added items**

Users can type in items that don't come from any recipe (e.g., "paper towels", "olive oil" as a pantry restock). These are stored as regular `shopping_list_items` with `recipe_ids = '{}'`.

### Decision 5: Free vs. premium enforcement

**Chosen: DB-level check via RLS + user_profiles.plan**

Free users can have exactly 1 shopping list. Premium users get unlimited. The RLS insert policy on `shopping_lists` checks the user's plan and current list count. Client also enforces this for UX (disable "New List" button, show upgrade prompt).

### Decision 6: Checked items behavior

**Chosen: Check toggles in place, "Clear Checked" action to delete**

Checked items stay visible (dimmed/struck-through) until the user explicitly taps "Clear Checked." This lets shoppers review what they've already picked up. A "Clear All" action resets the entire list.

## Risks / Trade-offs

- **Ingredient name matching is fuzzy** — "olive oil" vs "extra virgin olive oil" won't merge. Acceptable for v1; could add fuzzy matching or ingredient normalization later. → Mitigation: Keep items separate when unsure; users can manually edit.
- **No unit conversion** — 2 cups + 500ml stays as two lines. → Mitigation: Clear enough for v1. Unit conversion engine is a separate feature.
- **recipe_ids array on items** — Denormalized, but simple. If a recipe is deleted, the uuid stays in the array (orphaned but harmless). → Mitigation: Array is informational only, not a FK. Could add a cleanup job later.
- **No offline support** — Shopping in a store with bad cell signal could be painful. → Mitigation: TanStack Query caching on mobile provides some resilience. Full offline is a separate change.

## Open Questions

- None blocking implementation. Ship v1, iterate based on usage.
