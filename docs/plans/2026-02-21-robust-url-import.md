# Robust Recipe URL Import — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make recipe URL import succeed for the vast majority of recipe sites by adding a tiered fallback chain: JSON-LD → HTML microdata → Gemini AI extraction.

**Architecture:** `parseRecipeUrl()` in `src/lib/recipe-parser.ts` becomes a coordinator that tries three extraction tiers in order. Each tier returns `ParsedRecipe | null`. First non-null wins. A new file `src/lib/claude-extract-html.ts` handles Tier 3 (Gemini extraction from HTML). The fetch step gets better headers, timeout, and error messages. No changes needed to callers — `fetchRecipeFromUrl()` and `/api/extract-url` both call `parseRecipeUrl()` and get the improved behavior automatically.

**Tech Stack:** cheerio (existing), Gemini 2.0 Flash API (existing pattern in `claude-extract-text.ts`)

**Design doc:** `docs/plans/2026-02-21-robust-url-import-design.md`

---

### Task 1: Improve the HTML Fetcher

Extract fetching into its own function with better headers, timeout, and error messages.

**Files:**
- Modify: `src/lib/recipe-parser.ts`

**Step 1: Extract `fetchRecipeHtml()` function**

Replace the inline fetch in `parseRecipeUrl()` (lines 203-216) with a dedicated function:

```typescript
async function fetchRecipeHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en,nl;q=0.9,*;q=0.5",
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "This website blocked our request. Try importing a photo of the recipe instead."
        );
      }
      if (response.status === 404) {
        throw new Error("Page not found. Check the URL and try again.");
      }
      if (response.status >= 500) {
        throw new Error("This website is having issues. Try again later.");
      }
      throw new Error(`Could not fetch this URL (status ${response.status})`);
    }

    return await response.text();
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("This website took too long to respond. Try again later.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
```

**Step 2: Update `parseRecipeUrl()` to use `fetchRecipeHtml()`**

Replace lines 203-216 of `parseRecipeUrl()`:

```typescript
export async function parseRecipeUrl(url: string): Promise<ParsedRecipe> {
  const html = await fetchRecipeHtml(url);
  const $ = cheerio.load(html);
  // ... rest stays the same for now
```

**Step 3: Verify build compiles**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -20`
Expected: Build succeeds (or only unrelated warnings)

**Step 4: Commit**

```
git add src/lib/recipe-parser.ts
git commit -m "refactor: extract fetchRecipeHtml with better headers, timeout, and errors"
```

---

### Task 2: Refactor parseRecipeUrl into Tiered Chain

Restructure the function so Tier 1 (JSON-LD) is isolated and returns `ParsedRecipe | null` instead of throwing. This makes room for additional tiers.

**Files:**
- Modify: `src/lib/recipe-parser.ts`

**Step 1: Extract `tryJsonLd()` function**

Move the existing JSON-LD logic into its own function:

```typescript
function tryJsonLd($: cheerio.CheerioAPI): SchemaRecipe | null {
  let recipe: SchemaRecipe | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return;
    const raw = $(el).html() || "";
    try {
      const data = JSON.parse(raw);
      recipe = findRecipeInGraph(data);
    } catch {
      try {
        const data = JSON.parse(sanitizeJsonLd(raw));
        recipe = findRecipeInGraph(data);
      } catch {
        // truly invalid JSON, skip
      }
    }
  });
  return recipe;
}
```

**Step 2: Extract `schemaToRecipe()` helper**

Move the SchemaRecipe → ParsedRecipe mapping into a reusable function:

```typescript
function schemaToRecipe(
  r: SchemaRecipe,
  $: cheerio.CheerioAPI,
  url: string
): ParsedRecipe {
  const ingredients = (r.recipeIngredient || []).map((s) =>
    parseIngredient(decodeHtmlEntities(s))
  );
  const tags = parseTags(r);
  const htmlLang = $("html").attr("lang");
  const language = htmlLang
    ? htmlLang.split("-")[0].toLowerCase().slice(0, 2)
    : null;

  return {
    title: decodeHtmlEntities(r.name || "Untitled Recipe"),
    description: decodeHtmlEntities(r.description || ""),
    instructions: decodeHtmlEntities(parseInstructions(r.recipeInstructions)),
    prep_time_minutes: parseDuration(r.prepTime),
    cook_time_minutes: parseDuration(r.cookTime),
    servings: parseServings(r.recipeYield),
    language,
    tags,
    ingredients,
    source_url: url,
    source_name: getSourceNameFromUrl(url),
    imageUrl: parseImage(r.image),
  };
}
```

**Step 3: Rewrite `parseRecipeUrl()` as tiered chain**

```typescript
export async function parseRecipeUrl(url: string): Promise<ParsedRecipe> {
  const html = await fetchRecipeHtml(url);
  const $ = cheerio.load(html);

  // Tier 1: JSON-LD structured data
  const jsonLdRecipe = tryJsonLd($);
  if (jsonLdRecipe) {
    return schemaToRecipe(jsonLdRecipe, $, url);
  }

  // Tier 2: HTML microdata/scraping (TODO: Task 3)

  // Tier 3: Gemini AI extraction (TODO: Task 4)

  throw new Error(
    "Could not extract a recipe from this page. Try importing a photo of the recipe instead."
  );
}
```

**Step 4: Verify build compiles**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -20`
Expected: Build succeeds. Behavior identical to before — Tier 1 still handles all JSON-LD sites.

**Step 5: Commit**

```
git add src/lib/recipe-parser.ts
git commit -m "refactor: restructure parseRecipeUrl into tiered extraction chain"
```

---

### Task 3: Add Tier 2 — HTML Microdata/Scraping

Add a cheerio-based scraper that extracts recipe data from microdata attributes and common WordPress recipe plugin HTML patterns. Returns `ParsedRecipe | null`.

**Files:**
- Modify: `src/lib/recipe-parser.ts`

**Step 1: Add `tryHtmlScrape()` function**

```typescript
function tryHtmlScrape(
  $: cheerio.CheerioAPI,
  url: string
): ParsedRecipe | null {
  // Try microdata attributes (schema.org)
  let title =
    $('[itemprop="name"]').first().text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "";

  // Ingredients from microdata or common plugin classes
  const ingredients: string[] = [];
  $('[itemprop="recipeIngredient"], [itemprop="ingredients"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) ingredients.push(text);
  });

  // Try WordPress recipe plugin selectors if no microdata
  if (ingredients.length === 0) {
    $(
      ".wprm-recipe-ingredient, .tasty-recipe-ingredients li, .easyrecipe .ingredient, .recipe-card-ingredients li"
    ).each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(text);
    });
  }

  // Instructions from microdata or common plugin classes
  let instructions = "";
  const steps: string[] = [];
  $('[itemprop="recipeInstructions"]').each((_, el) => {
    // Could be a single block or individual steps
    const nested = $(el).find('[itemprop="step"], [itemprop="text"], li');
    if (nested.length > 0) {
      nested.each((__, step) => {
        const text = $(step).text().trim();
        if (text) steps.push(text);
      });
    } else {
      const text = $(el).text().trim();
      if (text) steps.push(text);
    }
  });

  // Try WordPress recipe plugin selectors if no microdata
  if (steps.length === 0) {
    $(
      ".wprm-recipe-instruction, .tasty-recipe-instructions li, .easyrecipe .instruction, .recipe-card-instructions li"
    ).each((_, el) => {
      const text = $(el).text().trim();
      if (text) steps.push(text);
    });
  }

  instructions = steps.join("\n");

  // Must have title AND (ingredients OR instructions) to be useful
  if (!title || (ingredients.length === 0 && !instructions)) {
    return null;
  }

  // Supplementary metadata
  const description =
    $('[itemprop="description"]').first().text().trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  const imageUrl =
    $('[itemprop="image"]').attr("src") ||
    $('[itemprop="image"] img').attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    null;

  const prepTime = parseDuration(
    $('[itemprop="prepTime"]').attr("content") ||
      $('[itemprop="prepTime"]').attr("datetime") ||
      null
  );
  const cookTime = parseDuration(
    $('[itemprop="cookTime"]').attr("content") ||
      $('[itemprop="cookTime"]').attr("datetime") ||
      null
  );
  const servings = parseServings(
    $('[itemprop="recipeYield"]').first().text().trim() || null
  );

  const htmlLang = $("html").attr("lang");
  const language = htmlLang
    ? htmlLang.split("-")[0].toLowerCase().slice(0, 2)
    : null;

  return {
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(description),
    instructions: decodeHtmlEntities(instructions),
    prep_time_minutes: prepTime,
    cook_time_minutes: cookTime,
    servings,
    language,
    tags: [], // can't reliably extract tags from HTML scraping
    ingredients: ingredients.map((s) => parseIngredient(decodeHtmlEntities(s))),
    source_url: url,
    source_name: getSourceNameFromUrl(url),
    imageUrl,
  };
}
```

**Step 2: Wire into `parseRecipeUrl()` chain**

Replace the Tier 2 TODO:

```typescript
  // Tier 2: HTML microdata / common recipe plugin scraping
  const scrapedRecipe = tryHtmlScrape($, url);
  if (scrapedRecipe) {
    return scrapedRecipe;
  }
```

**Step 3: Verify build compiles**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 4: Commit**

```
git add src/lib/recipe-parser.ts
git commit -m "feat: add Tier 2 HTML microdata/scraping fallback for recipe import"
```

---

### Task 4: Add Tier 3 — Gemini AI Extraction from HTML

Create `claude-extract-html.ts` that sends stripped HTML to Gemini 2.0 Flash. Wire it into the chain as the final fallback.

**Files:**
- Create: `src/lib/claude-extract-html.ts`
- Modify: `src/lib/recipe-parser.ts`

**Step 1: Create `claude-extract-html.ts`**

Follow the same pattern as `claude-extract-text.ts` (file at `src/lib/claude-extract-text.ts`):

```typescript
import type { ExtractedRecipe } from "./claude-extract";

const HTML_PROMPT = `Extract the recipe from the following webpage text content. The content has been stripped of navigation, scripts, and styling — focus on finding the recipe title, ingredients, and instructions.

Return ONLY valid JSON with this exact structure (no markdown, no code fences, no explanation):

{
  "title": "Recipe title",
  "description": "Brief 1-2 sentence description of the dish",
  "instructions": "Step-by-step instructions, each step on a new line",
  "prep_time_minutes": null or number,
  "cook_time_minutes": null or number,
  "servings": null or number,
  "language": "ISO 639-1 code (e.g. en, nl, fr, es, ja, zh, de, it, pt, ko, th, vi, ar)",
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {
      "ingredient_name": "name",
      "quantity": null or number (decimal),
      "unit": "unit or empty string",
      "notes": "any notes or empty string"
    }
  ]
}

Important guidelines:
- KEEP THE RECIPE IN ITS ORIGINAL LANGUAGE. Do NOT translate to English. If the recipe is in Dutch, return Dutch text. If it's in French, return French text. Preserve the original language exactly.
- For prep_time_minutes and cook_time_minutes: extract if stated. If not stated, estimate reasonable times based on the recipe steps and ingredients.
- For servings: extract if stated, otherwise estimate based on ingredient quantities.
- For tags: include 2-5 lowercase tags covering cuisine, meal type, dietary info, and cooking method. Only include tags that clearly apply.
- For language: detect the language of the recipe text and return the ISO 639-1 two-letter code.
- Ignore ads, SEO content, life stories, cookie notices, and navigation text. Extract ONLY the recipe.

If no recipe is found, return: {"error": "no_recipe"}

Webpage content:
`;

/**
 * Strip non-content HTML tags and return text suitable for AI extraction.
 */
export function stripHtmlForExtraction($: cheerio.CheerioAPI): string {
  // Remove non-content elements
  $(
    "script, style, nav, footer, header, aside, iframe, noscript, svg"
  ).remove();
  // Remove HTML comments
  $("*")
    .contents()
    .filter(function () {
      return this.type === "comment";
    })
    .remove();

  // Try to find the main content area first
  let text = "";
  const mainContent =
    $("article").first().text() ||
    $("main").first().text() ||
    $('[role="main"]').first().text();

  if (mainContent && mainContent.trim().length > 200) {
    text = mainContent.trim();
  } else {
    text = $("body").text() || $.text();
  }

  // Collapse whitespace
  text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();

  // Truncate if too long (Gemini handles long context but save tokens)
  if (text.length > 50_000) {
    text = text.slice(0, 50_000);
  }

  return text;
}

export async function extractRecipeFromHtml(
  text: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured" };
  }

  // Don't send near-empty content to Gemini
  if (text.trim().length < 100) {
    return { error: "Not enough content to extract a recipe" };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: HTML_PROMPT + text }] }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Gemini API HTTP error:", res.status, errorBody);
      throw new Error(`Gemini API error ${res.status}: ${errorBody}`);
    }

    const data = await res.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("Gemini API empty response:", JSON.stringify(data));
      throw new Error("Empty response from Gemini");
    }

    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(responseText);

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found on this page" };
    }

    return { data: parsed as ExtractedRecipe };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("JSON")) {
      return { error: "Could not parse recipe from this page" };
    }
    return { error: `Failed to extract recipe: ${message}` };
  }
}
```

Note: `stripHtmlForExtraction` needs a cheerio import. Add at top of file:

```typescript
import * as cheerio from "cheerio";
```

**Step 2: Wire Tier 3 into `parseRecipeUrl()`**

Add import at top of `recipe-parser.ts`:

```typescript
import {
  extractRecipeFromHtml,
  stripHtmlForExtraction,
} from "./claude-extract-html";
```

Replace the Tier 3 TODO in `parseRecipeUrl()`:

```typescript
  // Tier 3: AI extraction via Gemini
  const strippedText = stripHtmlForExtraction($);
  const aiResult = await extractRecipeFromHtml(strippedText);
  if (aiResult.data) {
    const d = aiResult.data;
    const htmlLang = $("html").attr("lang");
    const language =
      d.language ||
      (htmlLang ? htmlLang.split("-")[0].toLowerCase().slice(0, 2) : null);

    return {
      title: d.title || "Untitled Recipe",
      description: d.description || "",
      instructions: d.instructions || "",
      prep_time_minutes: d.prep_time_minutes,
      cook_time_minutes: d.cook_time_minutes,
      servings: d.servings,
      language,
      tags: d.tags || [],
      ingredients: d.ingredients || [],
      source_url: url,
      source_name: getSourceNameFromUrl(url),
      imageUrl:
        parseImage(
          $('meta[property="og:image"]').attr("content") || null
        ) || null,
    };
  }
```

**Step 3: Verify build compiles**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 4: Commit**

```
git add src/lib/claude-extract-html.ts src/lib/recipe-parser.ts
git commit -m "feat: add Tier 3 Gemini AI fallback for recipe URL import"
```

---

### Task 5: Manual Testing with Real URLs

Test the full chain with URLs that represent different tiers.

**Step 1: Test Tier 1 (JSON-LD) — should still work**

Pick a known JSON-LD site (e.g. seriouseats.com, allrecipes.com). Import via the app. Verify recipe extracts correctly.

**Step 2: Test Tier 3 (Gemini fallback)**

Find a recipe URL without JSON-LD. Examples to try:
- A recipe from a personal blog without schema.org markup
- A paywalled site that returns partial HTML
- A non-English recipe site

Import via the app. Verify:
- Recipe extracts with title, ingredients, instructions
- Language is correctly detected
- Image falls back to og:image if available

**Step 3: Test error cases**

- Invalid URL → "Please enter a valid URL"
- 404 page → "Page not found. Check the URL and try again."
- Non-recipe page (e.g. wikipedia.org) → "Could not extract a recipe from this page."
- Timeout (optional — hard to test without mocking)

**Step 4: Commit any fixes found during testing**

```
git commit -m "fix: address issues found during manual import testing"
```

---

### Task 6: Final Build Verification and Push

**Step 1: Run full build**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -30`
Expected: Build succeeds with no new errors.

**Step 2: Push all commits**

```
git push
```
