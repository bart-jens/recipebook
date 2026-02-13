## 1. Shared Components

- [x] 1.1 Create `IngredientRows` component (`src/app/(authenticated)/recipes/components/ingredient-rows.tsx`) with add/remove/reorder/edit functionality
- [x] 1.2 Create `RecipeForm` component (`src/app/(authenticated)/recipes/components/recipe-form.tsx`) with all recipe fields and ingredient editor, accepting optional initial data for edit mode

## 2. Create Recipe

- [x] 2.1 Create Server Action for recipe creation (`src/app/(authenticated)/recipes/actions.ts`) — insert recipe + ingredients in a single operation, set source_type to "manual", redirect to detail page
- [x] 2.2 Create new recipe page at `src/app/(authenticated)/recipes/new/page.tsx` using RecipeForm in create mode

## 3. Recipe List

- [x] 3.1 Replace placeholder `/recipes` page with actual recipe list — query user's recipes sorted by updated_at desc, show title, truncated description, and time info
- [x] 3.2 Add empty state with link to create new recipe
- [x] 3.3 Add "New recipe" button/link to the recipe list page

## 4. Recipe Detail

- [x] 4.1 Create recipe detail page at `src/app/(authenticated)/recipes/[id]/page.tsx` — fetch recipe + ingredients, display all fields, show ingredients in order
- [x] 4.2 Add edit and delete action links/buttons to the detail page

## 5. Edit Recipe

- [x] 5.1 Create Server Action for recipe update (`src/app/(authenticated)/recipes/[id]/actions.ts`) — update recipe fields + replace all ingredients, redirect to detail page
- [x] 5.2 Create edit page at `src/app/(authenticated)/recipes/[id]/edit/page.tsx` — fetch existing recipe, pass to RecipeForm in edit mode

## 6. Delete Recipe

- [x] 6.1 Add delete Server Action (in `src/app/(authenticated)/recipes/[id]/actions.ts`) — delete recipe, redirect to list
- [x] 6.2 Add delete confirmation using browser `confirm()` dialog before calling the Server Action

## 7. Verification

- [ ] 7.1 Verify full CRUD flow: create recipe with ingredients → view in list → view detail → edit → delete
- [x] 7.2 Verify `npm run build` succeeds with zero errors
