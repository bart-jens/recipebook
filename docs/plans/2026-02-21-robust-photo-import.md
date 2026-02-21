# Robust Photo/AI Recipe Extraction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix unit conversion and bracket issues in photo/text/HTML recipe extraction by switching to Gemini structured output mode, tightening prompts, and adding post-processing cleanup.

**Architecture:** Centralize shared extraction infrastructure in `claude-extract.ts` — JSON schema, Gemini caller with structured output, prompt rules, and cleanup function. Update `claude-extract-text.ts` to use the shared pieces. The new `claude-extract-html.ts` (from URL import plan) will use them from the start.

**Tech Stack:** Gemini 2.0 Flash API with `responseJsonSchema`, cheerio (existing)

**Design doc:** `docs/plans/2026-02-21-robust-photo-import-design.md`

---

### Task 1: Add Shared Extraction Infrastructure to `claude-extract.ts`

Add the JSON schema, shared prompt rules, `cleanExtractedRecipe()`, and structured Gemini caller alongside the existing `ExtractedRecipe` interface.

**Files:**
- Modify: `src/lib/claude-extract.ts`

**Step 1: Add the shared JSON schema constant**

Add after the `ExtractedRecipe` interface (after line 16):

```typescript
/**
 * JSON schema for Gemini structured output mode.
 * Matches the ExtractedRecipe interface.
 */
export const RECIPE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Recipe title" },
    description: {
      type: "string",
      description: "Brief 1-2 sentence description of the dish",
    },
    instructions: {
      type: "string",
      description:
        "Step-by-step instructions, each step on a new line. Plain text only, no brackets or numbering prefixes.",
    },
    prep_time_minutes: {
      type: "number",
      description:
        "Preparation time in minutes. Estimate if not stated.",
    },
    cook_time_minutes: {
      type: "number",
      description:
        "Cooking time in minutes. Estimate if not stated.",
    },
    servings: {
      type: "number",
      description:
        "Number of servings. Estimate if not stated.",
    },
    language: {
      type: "string",
      description:
        "ISO 639-1 two-letter language code of the recipe text (e.g. en, nl, fr, de, es, it)",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description:
        "2-5 lowercase tags: cuisine (italian, thai), meal type (dinner, dessert), dietary (vegetarian, gluten-free), method (baked, grilled)",
    },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ingredient_name: {
            type: "string",
            description: "Name of the ingredient, plain text without quantities or units",
          },
          quantity: {
            type: "number",
            description: "Numeric quantity as a decimal (e.g. 0.5 for half, 1.5 for one and a half)",
          },
          unit: {
            type: "string",
            description:
              "Standard abbreviation: cup, tbsp, tsp, oz, lb, g, kg, ml, l. For non-standard units, preserve as-is. Empty string if no unit.",
          },
          notes: {
            type: "string",
            description:
              "Preparation notes only (e.g. 'finely chopped', 'room temperature'). Empty string if none.",
          },
        },
        required: ["ingredient_name", "quantity", "unit", "notes"],
      },
    },
    error: {
      type: "string",
      description: "Set to 'no_recipe' if no recipe is found. Omit otherwise.",
    },
  },
  required: ["title", "instructions", "ingredients"],
};
```

**Step 2: Add the shared prompt rules**

```typescript
/**
 * Shared extraction rules appended to all Gemini recipe prompts.
 */
export const SHARED_EXTRACTION_RULES = `
Important rules:
- KEEP THE RECIPE IN ITS ORIGINAL LANGUAGE. Do NOT translate. If the recipe is in Dutch, return Dutch. If French, return French.
- PRESERVE EXACT MEASUREMENTS. Do NOT convert between measurement systems. If the source says "2 teaspoons", return quantity 2 and unit "tsp" — do NOT convert to "10 ml". If it says "1 cup", return "cup" — do NOT convert to "240 ml" or "grams".
- Do NOT add parentheses or brackets around text unless they appear in the original source material.
- Use standard abbreviations when the source uses the full word: cup, tbsp, tsp, oz, lb, g, kg, ml, l. For non-standard units (e.g. "eetlepel", "stuks", "snufje"), preserve as-is.
- For notes: only include preparation notes (e.g. "finely chopped", "room temperature"). Do not duplicate the ingredient name or quantity. Empty string if no notes.
- For tags: 2-5 lowercase tags covering cuisine, meal type, dietary info, cooking method. Only include tags that clearly apply.
- For language: detect the language and return the ISO 639-1 two-letter code.
- For prep/cook time: extract if stated, estimate if not.
- For servings: extract if stated, estimate from ingredient quantities if not.`;
```

**Step 3: Add `cleanExtractedRecipe()` function**

```typescript
/**
 * Post-process Gemini output to fix common issues:
 * - Strip unnecessary wrapping brackets/parentheses
 * - Collapse double brackets
 * - Trim whitespace
 */
export function cleanExtractedRecipe(raw: ExtractedRecipe): ExtractedRecipe {
  const cleanStr = (s: string): string => {
    let v = s.trim();
    // Collapse double brackets: ((text)) → (text)
    v = v.replace(/\(\(([^)]*)\)\)/g, "($1)");
    // Strip wrapping parens if entire string is wrapped: (text) → text
    if (v.startsWith("(") && v.endsWith(")") && !v.slice(1, -1).includes("(")) {
      v = v.slice(1, -1).trim();
    }
    // Strip wrapping square brackets: [text] → text
    if (v.startsWith("[") && v.endsWith("]") && !v.slice(1, -1).includes("[")) {
      v = v.slice(1, -1).trim();
    }
    return v;
  };

  return {
    title: cleanStr(raw.title || ""),
    description: cleanStr(raw.description || ""),
    instructions: raw.instructions
      ? raw.instructions
          .split("\n")
          .map((line) => cleanStr(line))
          .join("\n")
      : "",
    prep_time_minutes: raw.prep_time_minutes ?? null,
    cook_time_minutes: raw.cook_time_minutes ?? null,
    servings: raw.servings ?? null,
    language: raw.language || null,
    tags: (raw.tags || []).map((t) => t.toLowerCase().trim()).filter(Boolean),
    ingredients: (raw.ingredients || []).map((ing) => ({
      ingredient_name: cleanStr(ing.ingredient_name || ""),
      quantity: ing.quantity ?? null,
      unit: cleanStr(ing.unit || ""),
      notes: cleanStr(ing.notes || ""),
    })),
  };
}
```

**Step 4: Add `callGeminiStructured()` function**

Replace the existing private `callGemini()` with a shared structured version:

```typescript
/**
 * Call Gemini API with structured JSON output mode.
 * Returns parsed JSON object (guaranteed valid by Gemini's schema enforcement).
 */
export async function callGeminiStructured(
  apiKey: string,
  parts: unknown[],
  schema: object
): Promise<Record<string, unknown>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Gemini API HTTP error:", res.status, errorBody);
    throw new Error(`Gemini API error ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("Gemini API empty response:", JSON.stringify(data));
    throw new Error("Empty response from Gemini");
  }

  return JSON.parse(text);
}
```

**Step 5: Verify build compiles**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -20`
Expected: Build succeeds (new exports are unused so far but that's fine).

**Step 6: Commit**

```
git add src/lib/claude-extract.ts
git commit -m "feat: add shared Gemini structured output, prompt rules, and cleanup"
```

---

### Task 2: Update Image Extraction (`claude-extract.ts`)

Replace the freeform prompt + regex cleanup with structured output mode and the shared pieces.

**Files:**
- Modify: `src/lib/claude-extract.ts`

**Step 1: Replace the `RECIPE_PROMPT` and `extractRecipeFromImage()`**

Replace the existing `RECIPE_PROMPT` (lines 18-46) with:

```typescript
const IMAGE_PROMPT = `Extract the recipe from this image.
${SHARED_EXTRACTION_RULES}

If no recipe is found in the image, set the "error" field to "no_recipe".`;
```

Replace `extractRecipeFromImage()` (lines 80-110) with:

```typescript
export async function extractRecipeFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured" };
  }

  try {
    const parsed = await callGeminiStructured(
      apiKey,
      [
        { text: IMAGE_PROMPT },
        { inline_data: { mime_type: mediaType, data: base64Image } },
      ],
      RECIPE_JSON_SCHEMA
    );

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found in this image" };
    }

    return { data: cleanExtractedRecipe(parsed as unknown as ExtractedRecipe) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { error: `Failed to extract recipe: ${message}` };
  }
}
```

**Step 2: Remove the old private `callGemini()` function**

Delete lines 48-78 (the old `callGemini` function). It's replaced by the exported `callGeminiStructured`.

**Step 3: Verify build compiles**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 4: Commit**

```
git add src/lib/claude-extract.ts
git commit -m "feat: switch image extraction to structured output with cleanup"
```

---

### Task 3: Update Text Extraction (`claude-extract-text.ts`)

Switch from freeform to structured output, use shared rules and cleanup.

**Files:**
- Modify: `src/lib/claude-extract-text.ts`

**Step 1: Rewrite the file**

Replace the entire contents with:

```typescript
import type { ExtractedRecipe } from "./claude-extract";
import {
  RECIPE_JSON_SCHEMA,
  SHARED_EXTRACTION_RULES,
  callGeminiStructured,
  cleanExtractedRecipe,
} from "./claude-extract";

const TEXT_PROMPT = `Extract the recipe from the following text. The text may be from an Instagram post caption or similar social media post. Ignore any non-recipe content (hashtags, personal stories, engagement prompts, emojis, "link in bio" text, follower calls-to-action).
${SHARED_EXTRACTION_RULES}

If no recipe is found, set the "error" field to "no_recipe".

Text to extract from:
`;

export async function extractRecipeFromText(
  text: string
): Promise<{ data?: ExtractedRecipe; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured" };
  }

  try {
    const parsed = await callGeminiStructured(
      apiKey,
      [{ text: TEXT_PROMPT + text }],
      RECIPE_JSON_SCHEMA
    );

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found in the pasted text" };
    }

    return { data: cleanExtractedRecipe(parsed as unknown as ExtractedRecipe) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("JSON")) {
      return {
        error: "Could not parse recipe from text. Try pasting more of the caption.",
      };
    }
    return { error: `Failed to extract recipe: ${message}` };
  }
}
```

**Step 2: Verify build compiles**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 3: Commit**

```
git add src/lib/claude-extract-text.ts
git commit -m "feat: switch text extraction to structured output with cleanup"
```

---

### Task 4: Build `claude-extract-html.ts` with Structured Output

This is the Tier 3 file from the URL import plan. Build it using the shared infrastructure from the start.

**Files:**
- Create: `src/lib/claude-extract-html.ts`

**Step 1: Create the file**

```typescript
import * as cheerio from "cheerio";
import type { ExtractedRecipe } from "./claude-extract";
import {
  RECIPE_JSON_SCHEMA,
  SHARED_EXTRACTION_RULES,
  callGeminiStructured,
  cleanExtractedRecipe,
} from "./claude-extract";

const HTML_PROMPT = `Extract the recipe from the following webpage text content. The content has been stripped of navigation, scripts, and styling — focus on finding the recipe title, ingredients, and instructions. Ignore ads, SEO content, life stories, cookie notices, and navigation text.
${SHARED_EXTRACTION_RULES}

If no recipe is found, set the "error" field to "no_recipe".

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

  // Truncate if too long
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

  if (text.trim().length < 100) {
    return { error: "Not enough content to extract a recipe" };
  }

  try {
    const parsed = await callGeminiStructured(
      apiKey,
      [{ text: HTML_PROMPT + text }],
      RECIPE_JSON_SCHEMA
    );

    if (parsed.error === "no_recipe") {
      return { error: "No recipe found on this page" };
    }

    return { data: cleanExtractedRecipe(parsed as unknown as ExtractedRecipe) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { error: `Failed to extract recipe: ${message}` };
  }
}
```

**Step 2: Verify build compiles**

Run: `cd /Users/bart/claude/together-map && npx next build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 3: Commit**

```
git add src/lib/claude-extract-html.ts
git commit -m "feat: add HTML extraction with structured output for URL import Tier 3"
```

---

### Task 5: Manual Testing

Test all three extraction paths with real content.

**Step 1: Test photo import**

Import a recipe photo via the app. Verify:
- Units match the image exactly (no tsp→ml conversion)
- No unnecessary brackets in ingredients, instructions, or notes
- Quantities are correct decimals

**Step 2: Test text/Instagram import**

Paste a recipe caption. Verify same quality checks as above.

**Step 3: Test edge cases**

- Photo of a Dutch recipe → language should be "nl", units preserved (e.g. "eetlepel" not "tablespoon")
- Photo with fractions → quantities should be correct decimals (1/2 → 0.5)
- Very blurry photo → should return clear error, not garbage data

**Step 4: Commit any fixes found during testing**

```
git commit -m "fix: address issues found during extraction testing"
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
