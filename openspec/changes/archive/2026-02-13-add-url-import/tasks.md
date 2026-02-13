## 1. Parsing Utilities

- [x] 1.1 Create ingredient string parser (`src/lib/ingredient-parser.ts`) — parse "2 cups flour, sifted" into { quantity, unit, name, notes }, handle fractions, missing quantities, notes after comma
- [x] 1.2 Create ISO 8601 duration parser in the same or separate utility — parse "PT1H30M" into 90 minutes
- [x] 1.3 Create recipe URL parser (`src/lib/recipe-parser.ts`) — fetch URL, extract JSON-LD, parse schema.org/Recipe into app format, handle instruction variants (string, array, HowToStep)

## 2. Dependencies

- [x] 2.1 Install `cheerio` for HTML parsing

## 3. Import Flow

- [x] 3.1 Create Server Action (`src/app/(authenticated)/recipes/import-url/actions.ts`) — accept URL, call recipe parser, return structured recipe data or error
- [x] 3.2 Create import URL page (`src/app/(authenticated)/recipes/import-url/page.tsx`) — URL input form, on success show RecipeForm pre-filled with extracted data, use existing createRecipe action for saving with source_type "url" and source_url set

## 4. Recipe List Update

- [x] 4.1 Add "Import from URL" link to recipe list page next to "+ New recipe" button
- [x] 4.2 Add "Import from URL" link to the empty state section

## 5. Verification

- [x] 5.1 Test with a real recipe URL (e.g., a Serious Eats or AllRecipes page) — verify extraction, review, and save
- [x] 5.2 Test with a non-recipe URL — verify error message
- [x] 5.3 Verify `npm run build` succeeds with zero errors
