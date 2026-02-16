## 1. Database: Collections Schema

- [x] 1.1 Create migration: `collections` table (id, user_id, name, description, cover_image_url, created_at, updated_at) with updated_at trigger. RLS enabled: select/insert/update/delete scoped to user_id = auth.uid().
- [x] 1.2 Create migration: `collection_recipes` junction table (id, collection_id, recipe_id, added_at) with unique (collection_id, recipe_id). RLS enabled: operations scoped to owner of the parent collection. CASCADE deletes on both FKs.
- [x] 1.3 Create migration: Free tier trigger — `check_collection_limit()` function that rejects inserts on `collections` when user plan = 'free' and count >= 5.

## 2. Web: Collections List

- [x] 2.1 Add "Collections" section to the recipe list page. Show collection cards (name, recipe count, cover image or placeholder). "New Collection" button with free tier limit check.
- [x] 2.2 Create collection detail page (`/recipes/collections/[id]`). Show collection name, description, recipe list with search. Allow removing recipes from collection.
- [x] 2.3 Create/rename/delete collection UI: create modal with name + optional description, inline rename, delete with confirmation.

## 3. Web: Add to Collection

- [x] 3.1 Add "Add to Collection" action on recipe detail page. Shows collection picker with checkboxes (pre-checked for collections containing this recipe). Toggle adds/removes collection_recipes entries.
- [x] 3.2 Add "New Collection" option in the collection picker. Quick-create inline, then add recipe to it.

## 4. Mobile: Collections List

- [x] 4.1 Add "Collections" section to mobile recipes tab. Horizontal scroll or grid of collection cards. "New Collection" button with free tier limit check.
- [x] 4.2 Create collection detail screen. Show collection name, recipe list, remove action (swipe or long-press). Search within collection.
- [x] 4.3 Create/rename/delete collection UI on mobile: bottom sheet for create with name + description, swipe to delete, edit name on long-press.

## 5. Mobile: Add to Collection

- [x] 5.1 Add "Add to Collection" action on mobile recipe detail screen. Bottom sheet with collection picker checkboxes.
- [x] 5.2 Add "New Collection" option in the mobile collection picker. Quick-create inline.

## 6. Verification

- [x] 6.1 Verify free tier limit: confirm 6th collection is rejected at DB level and UI shows upgrade prompt.
- [x] 6.2 Verify cascade deletes: deleting a collection removes memberships, deleting a recipe removes it from collections.
- [x] 6.3 Verify recipe appears in multiple collections and collection picker shows correct state.
