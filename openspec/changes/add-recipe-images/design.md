# Design: Add Recipe Images

## Context

The `recipe_images` table exists but is unused. URL imports ignore the `image` field in schema.org data. No code path writes to Supabase Storage. The app has zero visual content, making it look like a developer prototype regardless of layout polish.

## Goals

- Extract and store images during URL import automatically (zero user effort)
- Allow manual image upload on mobile (camera + photo library)
- Display images on every recipe surface (cards, detail, profile)
- Keep image loading fast and bandwidth-efficient

## Non-Goals

- Multiple images per recipe (future — the `recipe_images` table supports it, but the UI will only show a primary image for now)
- Image editing/cropping (use the image as-is)
- AI-generated placeholder images (feels fake — better to show a clean empty state)

## Decisions

### 1. Denormalized `image_url` on recipes table

**Decision:** Add an `image_url` text column directly on the `recipes` table that stores the public URL of the primary image. This is derived from `recipe_images` but avoids a join on every list query.

**Rationale:** Recipe lists query hundreds of rows. Joining to `recipe_images` with a `WHERE is_primary = true` on every list render is wasteful. A denormalized URL column makes card rendering a single-table query.

**Alternative considered:** Always join to `recipe_images`. Rejected because it complicates every list query and the primary image rarely changes.

**Sync strategy:** When a new primary image is set (via upload or extraction), update both `recipe_images` and `recipes.image_url` in the same transaction.

### 2. Supabase Storage with public bucket

**Decision:** Store images in a `recipe-images` Supabase Storage bucket with public read access. Path format: `{user_id}/{recipe_id}/{uuid}.{ext}`.

**Rationale:** Recipe images need to be publicly readable (for public recipes in discover, shared links, etc.). Using per-user prefixes enables future per-user storage quotas. UUID filenames prevent collisions and cache-busting issues.

**Alternative considered:** Signed URLs for private access. Rejected because it adds complexity (URL expiry, refresh logic) and most recipe images are meant to be shared.

### 3. Image extraction during URL import

**Decision:** When the URL extractor finds a `image` field in schema.org/Recipe data, download the image server-side, upload to Supabase Storage, and set it as the recipe's primary image.

**Rationale:** 95%+ of recipe sites include an image in their schema.org data. Downloading server-side avoids CORS issues and lets us control image size. Users get images "for free" on every URL import.

**Processing:** Download the original, resize to max 1200px wide (maintaining aspect ratio) using sharp, upload as WebP for size efficiency. Store the Supabase public URL in `recipes.image_url`.

**Alternative considered:** Store the original URL directly (no download). Rejected because external URLs break when sites restructure, are subject to hotlinking blocks, and can't be optimized.

### 4. expo-image for mobile rendering

**Decision:** Use `expo-image` (built on SDWebImage/Glide) instead of React Native's `<Image>` for all recipe image display on mobile.

**Rationale:** `expo-image` provides: disk + memory caching, blurhash placeholder support, progressive loading, content-fit modes, and animated transitions. It's significantly faster and more memory-efficient than the built-in Image component.

**Alternative considered:** `react-native-fast-image`. Rejected because `expo-image` is maintained by the Expo team, has better TypeScript support, and integrates seamlessly with the managed workflow.

### 5. Image upload via expo-image-picker

**Decision:** On mobile, use `expo-image-picker` for both camera capture and photo library selection. Compress to 80% JPEG quality and max 1200px before upload.

**Rationale:** `expo-image-picker` is the standard Expo solution, handles permissions gracefully, and works in the managed workflow. Client-side compression reduces upload size and storage costs.

**Alternative considered:** `expo-camera` for a custom camera UI. Rejected as over-engineered — the system picker is familiar and sufficient.

### 6. Graceful empty states (no image)

**Decision:** When a recipe has no image, cards show a subtle gradient background with an icon (plate/utensils). Detail screen shows no hero at all (content starts immediately).

**Rationale:** Empty gray boxes look broken. A tasteful placeholder communicates "no image yet" without looking like an error. On detail, no image is better than a fake one.

**Alternative considered:** Always require an image. Rejected because manual recipes and some imports won't have one, and forcing upload creates friction.

## Risks / Trade-offs

**Storage costs.** Each image is ~100-200KB (WebP, 1200px). At 1000 recipes, that's ~200MB — well within Supabase free tier (1GB). Monitor as user base grows.

**Image download during import.** Adds 1-3 seconds to the URL import flow. Mitigated by doing the download and upload in parallel with the response (or showing the extracted data immediately and uploading the image in the background).

**Sharp dependency on server.** The `sharp` library requires native binaries. Works on Vercel serverless functions but adds cold start time. If this becomes a problem, move image processing to a Supabase Edge Function.
