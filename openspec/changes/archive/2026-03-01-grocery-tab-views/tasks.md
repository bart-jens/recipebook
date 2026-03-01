## 1. Restore Grocery Tab

- [x] 1.1 Remove `href: null` from the shopping-list tab entry in `mobile/app/(tabs)/_layout.tsx` to make it visible in the tab bar

## 2. Toggle Infrastructure

- [x] 2.1 Add `viewMode` state (`"planning" | "shopping"`) to `ShoppingListScreen`, initialized to `"planning"`
- [x] 2.2 On mount, read `grocery_view_mode` from AsyncStorage and set `viewMode` accordingly
- [x] 2.3 When user taps toggle, update `viewMode` state and write new value to AsyncStorage

## 3. Toggle UI

- [x] 3.1 Replace the item count text in the header right area with a two-option text toggle ("Planning · Shopping") — active option rendered in `colors.ink`, inactive in `colors.inkMuted`; tapping either word switches modes

## 4. Shopping View — Merge Logic

- [x] 4.1 Define a `MergedItem` type: `{ key: string; ingredient_name: string; quantity: number | null; unit: string | null; ids: string[]; recipe_ids: string[]; is_checked: boolean }`
- [x] 4.2 Implement `mergeByIngredient(items: ShoppingItem[]): MergedItem[]` — group by `ingredient_name.toLowerCase().trim() + "|" + (unit?.toLowerCase().trim() ?? "")`, sum quantities, collect all ids and recipe_ids
- [x] 4.3 In the render path, compute `mergedUnchecked = mergeByIngredient(unchecked)` and `mergedChecked = mergeByIngredient(checked)` when `viewMode === "shopping"`

## 5. Shopping View — Item Rendering

- [x] 5.1 Render merged unchecked items as a flat list (no recipe section headers) with the same row layout as planning view
- [x] 5.2 Below each merged item's ingredient name, render a muted attribution line: one recipe → recipe title; two+ recipes → titles joined by " · "; no recipe_ids → nothing
- [x] 5.3 Ensure recipe titles are available for all recipe_ids collected across merged items (extend the existing `recipeTitles` lookup to cover all collected IDs)

## 6. Shopping View — Check and Delete Behavior

- [x] 6.1 `toggleItem` in shopping mode: call existing toggle logic for each ID in `mergedItem.ids` (batch update all rows with the same merge key)
- [x] 6.2 `deleteItem` in shopping mode: delete all rows where `id IN mergedItem.ids` in a single Supabase call (or sequential calls if batch not available)
- [x] 6.3 Optimistic UI update: update local `items` state immediately before DB calls in both check and delete operations

## 7. Checked Section in Shopping View

- [x] 7.1 Use `mergedChecked` for the collapsible checked section when in shopping mode (same collapse behavior as planning view)
- [x] 7.2 "Clear all checked" in shopping mode deletes all underlying rows for all merged checked items (existing `clearChecked` RPC call covers this since it clears by shopping_list_id)
