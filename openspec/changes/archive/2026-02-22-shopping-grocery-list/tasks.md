## 1. Database — Tables & RLS

- [x] 1.1 Create migration for `shopping_lists` table (id, user_id, name, created_at, updated_at) with updated_at trigger and index on user_id
- [x] 1.2 Create migration for `shopping_list_items` table (id, shopping_list_id, ingredient_name, quantity, unit, is_checked, recipe_ids, created_at) with index on shopping_list_id
- [x] 1.3 Enable RLS on both tables — select/insert/update/delete policies scoped to owner via shopping_lists.user_id = auth.uid()
- [x] 1.4 Add free tier limit policy on shopping_lists insert (max 1 list for free users, check user_profiles.plan)

## 2. Database — RPC Functions

- [x] 2.1 Create `add_recipe_to_shopping_list(p_shopping_list_id uuid, p_recipe_id uuid)` RPC — fetches recipe_ingredients, applies merge logic (case-insensitive name + unit match = sum quantity, append recipe_id), returns updated items
- [x] 2.2 Create `clear_checked_items(p_shopping_list_id uuid)` RPC — deletes all checked items from the list, verifies ownership

## 3. Web — Shopping List Page

- [x] 3.1 Create `/shopping-list` route with page component — auto-create default list on first visit, display items grouped by checked/unchecked
- [x] 3.2 Build check-off UI — tap to toggle is_checked, strikethrough + dimmed styling for checked items, checked items at bottom
- [x] 3.3 Add manual item input at top of list — text field, enter to add
- [x] 3.4 Add "Clear Checked" and "Clear All" actions (Clear All with confirmation dialog)
- [x] 3.5 Show recipe attribution on items (secondary text: "from Pad Thai, Caesar Salad")
- [x] 3.6 Add inline quantity editing — click quantity to edit
- [x] 3.7 Add delete icon on hover for individual items
- [x] 3.8 Add "Shopping List" link in web navigation with item count badge

## 4. Mobile — Shopping List Screen

- [x] 4.1 Create shopping list screen component — auto-create default list, display items with large checkboxes (44x44pt minimum)
- [x] 4.2 Build check-off UI with haptic feedback — tap to toggle, animate checked items to bottom section
- [x] 4.3 Add manual item input at top of list
- [x] 4.4 Add "Clear Checked" and "Clear All" actions (Clear All with confirmation)
- [x] 4.5 Show recipe attribution on items
- [x] 4.6 Add long-press to edit item (quantity/unit modal)
- [x] 4.7 Add swipe-to-delete on individual items
- [x] 4.8 Add shopping list entry point — quick action on home screen with item count badge

## 5. Recipe Detail — Add to Shopping List

- [x] 5.1 Web: Add "Add to Shopping List" button on recipe detail page — calls RPC, shows toast with count
- [x] 5.2 Mobile: Add "Add to Shopping List" button on recipe detail screen — calls RPC, haptic feedback, shows toast
- [x] 5.3 Handle edge cases: no ingredients toast, auto-create list if none exists

## 6. Premium Multi-List (Web + Mobile) — DEFERRED

Deferred until premium launches. Free users get 1 list for now.
