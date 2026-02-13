## Context

The app already supports URL import via schema.org markup extraction. Instagram posts don't use schema.org — recipes are shared either as post captions (plain text) or as recipe card images. We need a different extraction strategy for each case.

Instagram's API ecosystem is restrictive: the oEmbed API only returns limited metadata, and scraping is blocked behind login walls. The most reliable approach is to use the user's clipboard — they paste the caption text or upload a screenshot, and we extract the recipe using Claude Vision API (for images) or structured text parsing (for captions).

## Goals / Non-Goals

**Goals:**
- Allow users to import recipes from Instagram posts
- Support two input modes: paste caption text, or upload recipe card image
- Use Claude Vision API to extract structured recipe data from images
- Reuse existing review-before-save flow (pre-filled RecipeForm)
- Store source information (`source_type: "instagram"`)

**Non-Goals:**
- Direct Instagram API integration (requires Meta app review, overkill for 2 users)
- Automatic Instagram post fetching by URL (Instagram blocks scraping)
- Saving/storing the original Instagram images in Supabase Storage
- Supporting Instagram Stories or Reels

## Decisions

### 1. Paste-based input instead of URL fetching
**Decision:** Users paste caption text or upload a screenshot rather than providing an Instagram URL.
**Rationale:** Instagram aggressively blocks scraping and requires OAuth app review for API access. For 2 users, copy-paste is faster and more reliable than building/maintaining a scraper. This also sidesteps all auth/rate-limiting issues.
**Alternative considered:** Using Instagram oEmbed API — only returns post thumbnail and author, not caption text or recipe data.

### 2. Claude Vision API for image extraction
**Decision:** Use the Anthropic SDK (`@anthropic-ai/sdk`) to send recipe card images to Claude and extract structured recipe data.
**Rationale:** Claude Vision excels at OCR + understanding structured content like recipe cards. This same approach will be reused for the photo-ocr-import change (step 5), so we're building shared infrastructure.
**Alternative considered:** Tesseract.js for client-side OCR — lower quality, can't understand recipe structure.

### 3. Shared extraction module
**Decision:** Create a `src/lib/claude-extract.ts` module that takes an image (base64) and a prompt, and returns structured recipe JSON. This will be reused by photo-ocr-import later.
**Rationale:** Both Instagram image import and cookbook photo import need the same Claude Vision → structured recipe pipeline. Building it as a shared module avoids duplication.

### 4. Two-tab input UI
**Decision:** The import page has two modes: "Paste Caption" (textarea) and "Upload Image" (file input). Both produce the same structured output.
**Rationale:** Instagram recipes come in both formats. Some users type recipes in captions, others use designed recipe card images. Supporting both covers the main use cases.

## Risks / Trade-offs

- **Claude API costs** → Minimal for 2 users. Each image extraction is ~1 API call. Set `ANTHROPIC_API_KEY` as env var.
- **Caption parsing quality** → Instagram captions have inconsistent formatting. Using Claude to parse captions (as text, not image) gives better results than regex-based parsing.
- **Image quality** → Screenshots may be low resolution. Claude Vision handles this well, but very small/blurry images may produce poor results. Show clear error messaging.
- **API key management** → `ANTHROPIC_API_KEY` must be set in Vercel env vars. The app will show a clear error if missing.
