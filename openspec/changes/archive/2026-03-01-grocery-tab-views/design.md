## Context

The grocery list screen (`mobile/app/(tabs)/shopping-list.tsx`) already exists with a solid implementation: check/uncheck with animation, items grouped by source recipe, collapsible checked section, manual item addition, and per-item delete. However, the tab is hidden (`href: null` in `_layout.tsx`) and the single "grouped by recipe" view works poorly in the store — seeing `Pasta Bolognese → garlic × 3` and `Stir Fry → garlic × 2` as separate entries creates unnecessary friction when scanning shelves.

The shopping_list_items table stores each item with `ingredient_name`, `quantity`, `unit`, and `recipe_ids[]` (array). Items are not merged across recipes at DB level.

## Goals / Non-Goals

**Goals:**
- Make the grocery tab visible and navigable from the tab bar
- Add a Planning/Shopping view toggle that persists across sessions
- Planning view: current behavior unchanged (grouped by recipe)
- Shopping view: client-side merge by ingredient + unit, recipe attribution, batch check/delete

**Non-Goals:**
- DB schema changes
- Serving-size scaling
- Meal planner / "this week's recipes" surface
- Tab badge or item count in nav bar
- Web app grocery feature
- Aisle-by-aisle grouping (would require ingredient categorization data)

## Decisions

### Client-side merge, not DB merge

**Decision**: Shopping view merges ingredients in the React component, not at the database or RPC layer.

**Rationale**: The DB model is the source of truth for individual items (needed for planning view). Merging at read time is simpler, has no schema impact, and the list is small enough (typically < 50 items) that client-side grouping has no performance cost.

**Alternative considered**: A new RPC that returns pre-merged items. Rejected — adds DB complexity, requires maintaining two data representations, and breaks the planning view's ability to show per-recipe grouping from the same fetch.

### Merge key: normalized ingredient_name + unit

**Decision**: `key = ingredient_name.toLowerCase().trim() + "|" + (unit?.toLowerCase().trim() ?? "")`

**Rationale**: Matches how ingredients are stored — the parser already standardizes names and units. Merging "garlic" (3 cloves) with "garlic" (2 cloves) requires the same unit. Mismatched units (e.g., "garlic cloves" vs "garlic head") stay separate — this is correct behavior, not a bug.

**Alternative considered**: Fuzzy name matching. Rejected — would merge things like "butter" and "peanut butter," creating wrong quantities.

### Batch check/delete in shopping view

**Decision**: In shopping mode, checking or deleting a merged item acts on ALL underlying DB rows with the same merge key.

**Rationale**: The semantic is "I have all the garlic I need" — the user thinks in ingredients, not per-recipe entries. Partial-check of one recipe's garlic while leaving another's is confusing and not useful.

**Implementation**: The merged item object carries an `ids: string[]` array of all underlying row IDs. Toggle and delete operations use `in` clauses against these IDs.

### Toggle persistence via AsyncStorage

**Decision**: Store the selected view mode (`"planning"` | `"shopping"`) in AsyncStorage under key `grocery_view_mode`. Default: `"planning"`.

**Rationale**: Users in "shopping" mode will switch to the tab repeatedly during a shopping trip. Forcing them to re-select the mode every time is friction. AsyncStorage is already used in the app for other preferences.

### Recipe attribution in shopping view

**Decision**: Show contributing recipe titles as a single muted metadata line below the ingredient name. Format: one recipe → recipe title; two+ recipes → "RecipeA · RecipeB" (truncated to available width); manually added (no recipe_ids) → nothing shown.

**Rationale**: Keeps the shopping view clean while answering "why do I need this?" without navigating away.

### Toggle UI placement

**Decision**: Small text toggle ("Planning · Shopping") in the header row, right-aligned, replacing the item count. Item count is secondary information; the view mode selector is more actionable.

**Rationale**: Keeps the header minimal. The item count is visible by counting rows anyway.

## Risks / Trade-offs

- **Merge produces wrong quantities if parser outputs inconsistent units** (e.g., "tbsp" vs "tablespoon"): The ingredient parser should already standardize units. If it doesn't, users see separate rows, which is annoying but not incorrect. Mitigation: No action needed now; fix at parser level if reported.

- **Long-press to delete in planning view is easy to trigger accidentally**: Existing behavior — not introduced by this change. Could be replaced with swipe-to-delete in a future polish pass.

- **Items with `recipe_ids = []` (manually added) have no attribution**: Correct — they appear in shopping view without recipe metadata, which is fine.

## Migration Plan

No migration needed. Single-file config change (`_layout.tsx`) + screen enhancement (`shopping-list.tsx`). No DB changes, no backend changes. Fully reversible by re-adding `href: null`.
