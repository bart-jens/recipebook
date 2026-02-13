## Why

Users frequently save recipes they find on Instagram. Currently, the only way to add these is manual entry, which is tedious — especially for recipes shared as post captions or recipe card images. Instagram import lets users paste a post URL and extract the recipe automatically, matching the same flow as URL import.

## What Changes

- Add Instagram post fetching via URL (using oEmbed API for caption text, or scraping)
- Extract recipe data from post captions using structured parsing (ingredients, instructions, times)
- For recipe card images in posts, use Claude Vision API to OCR the image and extract structured recipe data
- Add an "Import from Instagram" option alongside the existing URL import
- Reuse the existing review-before-save flow (pre-filled RecipeForm)

## Capabilities

### New Capabilities
- `instagram-import`: Fetching Instagram posts, extracting recipe data from captions and images, and converting to structured recipe format

### Modified Capabilities
- `recipe-form`: Adding `source_type: "instagram"` support and linking to Instagram source posts

## Impact

- New server action and parser module for Instagram content
- New API route or server action for Claude Vision API calls (image → recipe)
- New page at `/recipes/import-instagram`
- Updated recipe list page with "Import from Instagram" link
- New dependency: Claude Vision API (Anthropic SDK)
- Environment variable: `ANTHROPIC_API_KEY`
