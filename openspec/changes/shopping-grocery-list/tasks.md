## 1. Database — Tables & RLS

- [ ] 1.1 Create migration for `shopping_lists` table (id, user_id, name, created_at, updated_at) with updated_at trigger and index on user_id
- [ ] 1.2 Create migration for `shopping_list_items` table (id, shopping_list_id, ingredient_name, quantity, unit, is_checked, recipe_ids, created_at) with index on shopping_list_id
- [ ] 1.3 Enable RLS on both tables — select/insert/update/delete policies scoped to owner via shopping_lists.user_id = auth.uid()
- [ ] 1.4 Add free tier limit policy on shopping_lists insert (max 1 list for free users, check user_profiles.plan)

## 2. Database — RPC Functions

- [ ] 2.1 Create `add_recipe_to_shopping_list(p_shopping_list_id uuid, p_recipe_id uuid)` RPC — fetches recipe_ingredients, applies merge logic (case-insensitive name + unit match = sum quantity, append recipe_id), returns updated items
- [ ] 2.2 Create `clear_checked_items(p_shopping_list_id uuid)` RPC — deletes all checked items from the list, verifies ownership

## 3. Web — Shopping List Page

- [ ] 3.1 Create `/shopping-list` route with page component — auto-create default list on first visit, display items grouped by checked/unchecked
- [ ] 3.2 Build check-off UI — tap to toggle is_checked, strikethrough + dimmed styling for checked items, checked items at bottom
- [ ] 3.3 Add manual item input at top of list — text field, enter to add
- [ ] 3.4 Add "Clear Checked" and "Clear All" actions (Clear All with confirmation dialog)
- [ ] 3.5 Show recipe attribution on items (secondary text: "from Pad Thai, Caesar Salad")
- [ ] 3.6 Add inline quantity editing — click quantity to edit
- [ ] 3.7 Add delete icon on hover for individual items
- [ ] 3.8 Add "Shopping List" link in web navigation with item count badge

## 4. Mobile — Shopping List Screen

- [ ] 4.1 Create shopping list screen component — auto-create default list, display items with large checkboxes (44x44pt minimum)
- [ ] 4.2 Build check-off UI with haptic feedback — tap to toggle, animate checked items to bottom section
- [ ] 4.3 Add manual item input at top of list
- [ ] 4.4 Add "Clear Checked" and "Clear All" actions (Clear All with confirmation)
- [ ] 4.5 Show recipe attribution on items
- [ ] 4.6 Add long-press to edit item (quantity/unit modal)
- [ ] 4.7 Add swipe-to-delete on individual items
- [ ] 4.8 Add shopping list entry point — quick action on home screen with item count badge

## 5. Recipe Detail — Add to Shopping List

- [ ] 5.1 Web: Add "Add to Shopping List" button on recipe detail page — calls RPC, shows toast with count
- [ ] 5.2 Mobile: Add "Add to Shopping List" button on recipe detail screen — calls RPC, haptic feedback, shows toast
- [ ] 5.3 Handle edge cases: no ingredients toast, auto-create list if none exists

## 6. Premium Multi-List (Web + Mobile)

- [ ] 6.1 Web: Add list selector dropdown for premium users — create/switch/rename lists
- [ ] 6.2 Mobile: Add list selector sheet for premium users — create/switch/rename lists
- [ ] 6.3 Hide list selector for free users, show upgrade prompt when they hit the limit
