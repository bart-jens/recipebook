## Context

The project has a working Next.js 14 app with Supabase auth, all database tables created, and RLS policies in place. The `/recipes` route exists as a placeholder. We need to build the full recipe CRUD flow — this is the first feature users will actually interact with.

The app is used in the kitchen while cooking, so mobile usability with big tap targets and clear typography is critical.

## Goals / Non-Goals

**Goals:**
- Full CRUD for recipes (create, read, update, delete)
- Structured ingredient entry with quantity/unit/name/notes
- Reorderable ingredient list
- Mobile-first form design with large inputs
- Recipe list with basic sorting (newest first)
- Recipe detail page showing all data cleanly

**Non-Goals:**
- Tags management (that's change #7: add-search-filter)
- Ratings/notes (that's change #6: add-ratings-notes)
- Image upload (that's change #5: add-photo-ocr-import)
- URL or photo import (changes #3-5)
- Search or filtering (change #7)

## Decisions

### Server Actions for mutations
Use Next.js Server Actions for create/update/delete operations. This keeps the code simple — no API routes needed. The Supabase server client handles auth context automatically.

**Alternative considered:** API routes (`/api/recipes`) — more boilerplate, no benefit for this use case.

### Form state management
Use React `useState` for form state with controlled inputs. No form library needed — the form is structured but not complex enough to warrant Formik/React Hook Form.

**Alternative considered:** React Hook Form — good for complex validation but overkill here. Can add later if forms grow.

### Ingredient table as dynamic form rows
Ingredients are edited inline as rows in a table-like layout. Each row has: quantity (number input), unit (text input), name (text input), notes (text input), and remove/reorder buttons. An "Add ingredient" button appends a new empty row.

**Alternative considered:** Separate modal for each ingredient — too many taps on mobile.

### Reordering via move up/down buttons
Simple up/down arrow buttons for reordering ingredients. No drag-and-drop — it's harder to implement correctly on mobile touch devices and not worth the complexity for a list that's typically 5-15 items.

**Alternative considered:** Drag-and-drop (dnd-kit) — complex touch handling, accessibility concerns. Not worth it.

### Optimistic navigation after mutations
After create/update/delete, use `redirect()` to navigate immediately. No toast notifications or success states — keep it simple. Errors show inline on the form.

### Page structure
```
src/app/(authenticated)/recipes/
  page.tsx              # Recipe list (server component)
  new/
    page.tsx            # New recipe form (client component)
  [id]/
    page.tsx            # Recipe detail (server component)
    edit/
      page.tsx          # Edit recipe form (client component)
    actions.ts          # Server actions for this recipe
src/app/(authenticated)/recipes/
  actions.ts            # Server actions for create
  components/
    recipe-form.tsx     # Shared form component (create + edit)
    ingredient-rows.tsx # Ingredient table editor
```

## Risks / Trade-offs

**[Risk] Large form on mobile** → Use single-column layout, large inputs (py-3), clear labels. Group related fields (times + servings on one row on desktop, stacked on mobile).

**[Trade-off] No client-side validation** → Rely on HTML5 required attributes and database constraints. Keeps code simple. Add validation later if users hit confusing errors.

**[Trade-off] No autosave** → Simple explicit save button. Recipes are typically entered in one sitting, not drafted over time.
