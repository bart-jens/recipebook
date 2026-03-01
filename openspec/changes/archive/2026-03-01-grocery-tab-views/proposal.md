## Why

The grocery list screen exists in the mobile app but is hidden from the tab bar (`href: null`), making it effectively invisible to users. The existing single-view UI (grouped by recipe) serves meal planning but is awkward for use in the store — mixing multiple recipes creates a cluttered list when you just need to scan for items. Restoring the tab and adding a Planning/Shopping toggle makes groceries a genuinely useful, discoverable feature.

## What Changes

- **Restore grocery tab** in the bottom tab bar (remove `href: null`, show it as the 4th tab)
- **Add Planning/Shopping toggle** to the grocery screen header — a minimal text toggle persisted via AsyncStorage
- **Planning view** (default): existing behavior — items grouped by source recipe with per-item delete
- **Shopping view**: client-side merge of items by ingredient name + unit, summing quantities and collecting recipe attribution; checking/deleting a merged item acts on all underlying DB rows with the same merge key
- **Recipe attribution in Shopping view**: each merged item shows which recipe(s) contributed to it as muted metadata (e.g., "Pasta · Stir Fry")

Out of scope: serving-size scaling, meal planner, tab badge/count, web parity (no grocery feature exists on web).

## Capabilities

### New Capabilities

- `grocery-list`: Grocery list feature — tab navigation, planning view (by recipe), shopping view (merged by ingredient), toggle persistence, recipe attribution display

### Modified Capabilities

(none — this is a new capability area; the existing shopping_lists/shopping_list_items schema is unchanged)

## Impact

- `mobile/app/(tabs)/_layout.tsx`: remove `href: null` from shopping-list tab
- `mobile/app/(tabs)/shopping-list.tsx`: add toggle UI + shopping-mode merge logic
- No DB schema changes
- No web changes
