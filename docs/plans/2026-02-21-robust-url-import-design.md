# Robust Recipe URL Import

## Problem

Users report many recipe URLs failing to import. The current parser only tries JSON-LD structured data. When that's missing or broken, import fails with "No recipe found at this URL" and no fallback.

## Solution: Tiered Extraction Chain

Try extraction methods in order of cost and speed. First success wins.

```
fetch HTML (improved headers + timeout)
  → Tier 1: JSON-LD parsing (existing, free, instant)
  → Tier 2: Microdata/HTML scraping (new, free, instant)
  → Tier 3: Gemini AI extraction from HTML (new, ~$0.001, ~2-3s)
  → All failed: clear error message
```

## Tier 1: JSON-LD (existing)

No changes. Already handles ~70% of recipe sites. Includes the `sanitizeJsonLd` fix for WordPress control characters.

## Tier 2: Microdata/HTML Scraping

Cheerio-based extraction from HTML attributes and common patterns:

- `itemprop="recipeIngredient"`, `itemprop="recipeInstructions"`, etc. (schema.org microdata)
- WordPress recipe plugin classes: `.wprm-recipe`, `.tasty-recipe`, `.easyrecipe`, `.recipe-card`
- OpenGraph metadata as supplementary data (`og:title`, `og:image`, `og:description`)

Validates that at minimum a title + ingredients OR title + instructions were found. Returns null otherwise — partial scrapes aren't useful.

## Tier 3: Gemini AI Extraction

Send stripped HTML to Gemini 2.0 Flash with a recipe extraction prompt. Reuses the same `ExtractedRecipe` output format and prompt style from `claude-extract-text.ts`.

HTML preprocessing before sending to Gemini:
- Strip `<script>`, `<style>`, `<nav>`, `<footer>`, `<header>`, `<aside>` tags
- Strip HTML comments
- If remaining text > 50k chars, extract only `<article>`, `<main>`, or `[role="main"]` content
- If still > 50k chars, truncate (Gemini handles long context but no need to waste tokens on cookie banners)

New file: `src/lib/claude-extract-html.ts` — follows same pattern as `claude-extract-text.ts` but with an HTML-specific prompt.

## Improved Fetcher

Current fetcher is minimal. Improvements:

- **User-Agent**: Use a realistic browser UA string
- **Accept headers**: `text/html,application/xhtml+xml`
- **Accept-Language**: `en,nl;q=0.9,*;q=0.5` (cover English + Dutch content)
- **Timeout**: 10 second AbortController timeout
- **Error messages**: Map HTTP status codes to user-friendly messages:
  - 403: "This website blocked our request. Try importing a photo instead."
  - 404: "Page not found. Check the URL and try again."
  - 5xx: "This website is having issues. Try again later."

## Output Format

All three tiers produce `ParsedRecipe` (same interface as today). The caller doesn't know which tier succeeded. Tier 3 returns `ExtractedRecipe` from Gemini which gets mapped to `ParsedRecipe` with source metadata added.

## File Changes

| File | Change |
|------|--------|
| `src/lib/recipe-parser.ts` | Refactor into tiered chain. Add Tier 2 HTML scraping. Improve fetcher. |
| `src/lib/claude-extract-html.ts` | New. Gemini extraction from HTML text (Tier 3). |
| `src/lib/claude-extract-text.ts` | No changes (but shared prompt patterns). |
| `src/lib/claude-extract.ts` | No changes (ExtractedRecipe type stays). |

## What This Doesn't Include

- **Headless browser** — heavy infra dependency, revisit if JS-rendered sites become a problem
- **AI validation loop** — re-checking output with another API call, premature for now
- **Domain-level caching** — remembering which tier works per domain, not needed at scale
- **Retry logic** — single attempt per tier is sufficient; the chain itself is the retry strategy

## Cost

- Tier 1 + 2: free
- Tier 3: ~$0.001 per import (Gemini 2.0 Flash). Only triggered when Tier 1+2 fail.
- Expected: ~30% of imports hit Tier 3. At current user volume, negligible cost.
