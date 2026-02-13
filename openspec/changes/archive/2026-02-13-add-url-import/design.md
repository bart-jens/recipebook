## Context

The recipe CRUD system is in place with a shared RecipeForm component. We need to add a way to import recipes from URLs. Most recipe websites embed schema.org/Recipe structured data as JSON-LD in their HTML, which gives us clean structured data without needing to scrape messy HTML.

## Goals / Non-Goals

**Goals:**
- Parse schema.org/Recipe JSON-LD from any recipe URL
- Extract: title, description, instructions, ingredients (parsed into quantity/unit/name/notes), prep time, cook time, servings
- Show extracted data in the existing RecipeForm for review before saving
- Handle common edge cases (multiple recipes on page, missing fields, different instruction formats)

**Non-Goals:**
- Scraping sites that don't have schema.org markup (out of scope — most recipe sites have it)
- Handling paywalled or login-required sites
- Caching or storing fetched HTML
- Instagram import (that's a separate change)

## Decisions

### Server-side fetch with Server Action
Fetch the URL server-side via a Server Action to avoid CORS issues. Use Node's built-in `fetch` to get the HTML, then parse it.

**Alternative considered:** Client-side fetch — blocked by CORS on most recipe sites.

### cheerio for HTML parsing
Use `cheerio` to parse the HTML and extract `<script type="application/ld+json">` tags. It's lightweight, fast, and doesn't need a browser. No need for a full headless browser since we only need to read the static HTML.

**Alternative considered:** `node-html-parser` — similar but cheerio is more widely used and battle-tested.

### Ingredient string parsing
Parse ingredient strings like "2 1/2 cups all-purpose flour, sifted" into structured parts. Use a simple regex-based parser:
1. Extract quantity (handles fractions, decimals, ranges)
2. Match known units (cups, tbsp, tsp, oz, lb, g, kg, ml, l, etc.)
3. Remaining text is the ingredient name
4. Parenthetical text or text after comma becomes notes

No external dependency needed — a focused utility function handles the common cases.

**Alternative considered:** `recipe-ingredient-parser-v3` npm package — adds a dependency for something we can handle with ~50 lines of code.

### Two-step flow: paste URL → review → save
1. User pastes URL on `/recipes/import-url`
2. Server Action fetches and parses the URL
3. Extracted data is shown in RecipeForm (pre-filled, editable)
4. User reviews/edits and clicks "Save Recipe" (uses existing createRecipe action)

This reuses the existing RecipeForm component — no new form needed.

### ISO 8601 duration parsing
schema.org uses ISO 8601 durations for times (e.g., "PT30M" = 30 minutes, "PT1H15M" = 75 minutes). Parse these into total minutes.

### Page structure
```
src/app/(authenticated)/recipes/import-url/
  page.tsx              # URL input + preview form
  actions.ts            # Server action: fetch URL → parse → return data
src/lib/
  recipe-parser.ts      # schema.org/Recipe extraction logic
  ingredient-parser.ts  # Ingredient string → structured data
```

## Risks / Trade-offs

**[Risk] Sites without schema.org markup** → Show clear error: "No recipe found at this URL. The site may not support recipe markup." Users can still enter manually.

**[Risk] Ingredient parsing imperfect** → The parser handles common patterns but won't be perfect. That's why users review before saving — they can fix any parsing errors in the form.

**[Risk] Sites blocking server-side fetches** → Some sites block non-browser User-Agents. Set a reasonable User-Agent header. If blocked, show error.

**[Trade-off] No microdata/RDFa support** → Only parsing JSON-LD format. This covers the vast majority of recipe sites. Microdata support can be added later if needed.
