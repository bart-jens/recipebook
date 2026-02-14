# Add Recipe Images

## Why

Recipe apps without food photography feel like spreadsheets. Every competing app — from Paprika to Mela to NYT Cooking — leads with images. Currently, EefEats has zero visual content: every screen is text cards on a flat background. No amount of design tokens, shadows, or spacing refinement will fix this. Images are the single highest-impact improvement to the app's perceived quality.

The `recipe_images` table already exists in the database (specced and migrated) but is completely unused by any code path. The URL import pipeline extracts recipe data but ignores the `image` field in schema.org/Recipe markup. This change activates the existing infrastructure and wires images into every surface.

## What Changes

**Image extraction from URL imports.** The existing URL extractor (`src/lib/extract-recipe.ts`) already parses schema.org/Recipe JSON-LD. This change extends it to extract the `image` field (which is present on 95%+ of recipe sites) and download it to Supabase Storage.

**Image upload on mobile.** Users can take a photo or pick from their library to set a recipe's hero image. Uses `expo-image-picker` for capture and Supabase Storage for upload.

**Image display everywhere.** Recipe cards (home, discover, my recipes) become image-led. The recipe detail screen gets a hero image. Public profiles show thumbnails in recipe lists.

**Web app support.** The web recipe list and detail pages also display images when available, with a simple upload button on the edit form.

## Capabilities

### New Capabilities
- `recipe-images` — Image storage, retrieval, and display for recipes across web and mobile

### Modified Capabilities
- `url-import` — Extracts and stores recipe images during URL import
- `recipe-crud` — Recipe cards and detail screens display hero images

## Impact

- **New dependency:** `expo-image-picker` (mobile), `expo-image` (mobile — performant image component)
- **Supabase Storage:** Create `recipe-images` bucket with public read access
- **Modified API route:** `/api/extract-url` downloads and stores extracted images
- **New migration:** Add `image_url` convenience column to `recipes` table for the primary image URL (denormalized for query performance)
- **Modified screens:** All recipe list screens (3 on mobile, 1 on web), recipe detail (mobile + web), recipe form (mobile + web)
