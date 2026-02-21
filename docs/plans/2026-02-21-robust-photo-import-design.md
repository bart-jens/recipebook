# Robust Photo/AI Recipe Extraction

## Problem

Users report two issues with photo-imported recipes:
1. **Wrong units** — Gemini converts measurements (e.g. teaspoons → ml, cups → grams) instead of preserving what's in the image
2. **Unnecessary brackets** — Gemini wraps text in parentheses throughout ingredients, instructions, and notes

Both issues come from Gemini's output. The current prompts are too loose, and there's zero post-processing — raw AI output goes straight to the database.

## Solution: Three Layers

### Layer 1: Gemini Structured Output Mode

Switch all extraction calls from freeform text to Gemini's `responseJsonSchema` mode. Pass `generationConfig.responseMimeType: "application/json"` and `generationConfig.responseJsonSchema` with the `ExtractedRecipe` schema.

This:
- Guarantees valid JSON (eliminates code fence stripping and JSON parse failures)
- Enforces exact schema shape
- Uses `description` fields on each property to guide the model's output format

Replaces the current pattern of "Return ONLY valid JSON" + regex cleanup.

### Layer 2: Tightened Prompts

Add these explicit rules to all extraction prompts (photo, text, HTML):

```
- Preserve the EXACT measurements from the source. Do NOT convert between
  measurement systems. If the recipe says "2 teaspoons", return quantity 2
  and unit "tsp" — do NOT convert to "10 ml".
- Do NOT add parentheses or brackets around text unless they appear in the
  original source material.
- Use these standard abbreviations when the source uses the full word:
  cup, tbsp, tsp, oz, lb, g, kg, ml, l. If the source uses a non-standard
  unit (e.g. "eetlepel", "stuks"), preserve it as-is.
- For notes: only include genuinely useful preparation notes (e.g. "finely
  chopped", "room temperature"). Do not duplicate the ingredient name or
  quantity in notes.
```

### Layer 3: Post-Processing Cleanup

A shared `cleanExtractedRecipe()` function that runs on every `ExtractedRecipe` before it reaches the form/database:

- Strip leading/trailing parentheses from all string fields where the entire value is wrapped: `(butter)` → `butter`
- Collapse double brackets: `((softened))` → `(softened)`
- Trim whitespace from all string fields
- Remove empty notes fields (notes that are just whitespace or empty brackets)

This is a deterministic safety net — catches issues the prompt improvements miss.

## Shared Code in `claude-extract.ts`

`claude-extract.ts` already exports the `ExtractedRecipe` interface. Add to it:

1. `RECIPE_JSON_SCHEMA` — the Gemini `responseJsonSchema` object matching `ExtractedRecipe`
2. `SHARED_EXTRACTION_RULES` — the tightened prompt text (unit preservation, no brackets, etc.)
3. `cleanExtractedRecipe(raw: ExtractedRecipe): ExtractedRecipe` — post-processing cleanup
4. `callGeminiStructured(apiKey: string, parts: unknown[], schema: object): Promise<unknown>` — shared Gemini caller that uses structured output mode

All three extraction files import from `claude-extract.ts` instead of duplicating.

## Files Affected

| File | Change |
|------|--------|
| `src/lib/claude-extract.ts` | Add shared schema, rules, cleanup function, structured Gemini caller. Update image extraction. |
| `src/lib/claude-extract-text.ts` | Switch to structured output, use shared rules + cleanup. |
| `src/lib/claude-extract-html.ts` | New file (from URL import plan) — build with structured output from the start. |

## What This Doesn't Include

- **Unit enum constraint in schema** — too restrictive for foreign recipes with non-English units
- **AI validation loop** — overkill; deterministic cleanup handles bracket/unit issues
- **Re-parsing through `parseIngredient()`** — photo/text imports return structured data; re-parsing would cause more problems
