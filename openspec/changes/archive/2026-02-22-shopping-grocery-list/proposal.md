## Why

Every recipe app users try before EefEats has a shopping list. It's the #1 expected utility feature — you decide what to cook, then need to know what to buy. Without it, users screenshot ingredient lists or type them into a separate notes app. This is a table-stakes feature for a kitchen-first platform, and it bridges the gap between "browsing recipes" and "actually cooking them."

## What Changes

- New `shopping_lists` and `shopping_list_items` tables for persistent, per-user grocery lists
- "Add to Shopping List" button on recipe detail pages (web + mobile)
- Dedicated shopping list view with check-off UI optimized for in-store use (big tap targets, one-hand operation)
- Smart ingredient merging: adding two recipes that both use "olive oil" combines into one line with summed quantities
- Clear completed / clear all actions
- Unit-aware merging (e.g., 2 cups + 1 cup = 3 cups, but 2 cups + 500g stays separate)

## Capabilities

### New Capabilities
- `shopping-list`: Shopping list data model, persistence, ingredient merging logic, and RLS policies
- `shopping-list-ui`: Shopping list views on web and mobile — add-from-recipe flow, list management, check-off interface

### Modified Capabilities
- `recipe-interactions`: Recipe detail page gets a new "Add to Shopping List" action alongside existing Cooked It / Save / Favorite actions

## Impact

- **Database**: Two new tables (`shopping_lists`, `shopping_list_items`) with RLS policies
- **Web**: New shopping list page, "Add to Shopping List" button on recipe detail
- **Mobile**: New shopping list screen (accessible from recipe detail and tab bar or home), check-off UI
- **API**: May need a server-side merge function (RPC) for intelligent ingredient combining
- **Free vs Premium**: Free users get 1 active shopping list. Premium users get multiple named lists (e.g., "Costco", "Farmers Market", "Weekly")
