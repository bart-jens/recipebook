## Why

Users reported they can't add recipes to collections. The root cause: the web recipe detail page only shows the collection picker to the **recipe owner** (`{isOwner && <CollectionPicker />}`). If you're viewing someone else's public recipe, you can't save it to your collection.

The database RLS policies are correct — they allow any user to add any recipe to their own collections. The bug is purely a UI gating issue.

## What Changes

- **Show the collection picker to all authenticated users**, not just recipe owners
- Users can add any visible recipe (their own or public) to their own collections
- The picker already fetches only the current user's collections, so no backend changes needed

## Impact

**Frontend (Web):** `src/app/(authenticated)/recipes/[id]/recipe-detail.tsx`
- Remove the `isOwner` gate around `<CollectionPicker>` (lines 208-211)
- The picker should be shown to all logged-in users viewing any recipe

**Frontend (Mobile):** Collections are not yet implemented on mobile (platform parity gap tracked separately)

**No backend changes needed.** RLS already permits this — the `collection_recipes` insert policy checks that the collection belongs to `auth.uid()`, not that the recipe belongs to the user.
