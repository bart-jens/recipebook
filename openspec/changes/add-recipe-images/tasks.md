# Tasks: Add Recipe Images

## 1. Database & Storage Setup

- [ ] 1.1 Create migration: add `image_url` (text, nullable) column to `recipes` table
- [ ] 1.2 Create Supabase Storage bucket `recipe-images` with public read access
- [ ] 1.3 Add storage policy: authenticated users can upload to their own prefix (`{user_id}/`)
- [ ] 1.4 Add storage policy: public read access for all files in `recipe-images` bucket

## 2. Image Processing Module

- [ ] 2.1 Install `sharp` as a dependency in the web project
- [ ] 2.2 Create `src/lib/process-image.ts` — module that takes a buffer or URL, resizes to max 1200px wide, converts to WebP at 80% quality, returns a Buffer
- [ ] 2.3 Create `src/lib/upload-recipe-image.ts` — module that uploads a processed image buffer to Supabase Storage at path `{userId}/{recipeId}/{uuid}.webp`, inserts a row in `recipe_images` with `is_primary: true`, and updates `recipes.image_url` with the public URL
- [ ] 2.4 Unit test: process-image resizes a 2000px image to 1200px wide and outputs WebP

## 3. URL Import Image Extraction

- [ ] 3.1 Modify `src/lib/extract-recipe.ts` to extract the `image` field from schema.org/Recipe JSON-LD (handles string, array of strings, and ImageObject)
- [ ] 3.2 Return extracted image URL in the extraction result (new field `imageUrl: string | null`)
- [ ] 3.3 Modify `/api/extract-url` route: after extraction, if `imageUrl` is present, download the image, process it via `process-image.ts`, upload via `upload-recipe-image.ts`
- [ ] 3.4 Update the mobile import-url flow: after saving the recipe, set `image_url` from the extraction result
- [ ] 3.5 Test: import a recipe from seriouseats.com and verify the image is stored and `image_url` is set

## 4. Mobile Image Upload

- [ ] 4.1 Install `expo-image-picker` and `expo-image` in the mobile project
- [ ] 4.2 Create `mobile/lib/upload-image.ts` — helper that takes an image URI from the picker, compresses to JPEG 80% quality (max 1200px), uploads to Supabase Storage, inserts `recipe_images` row, and updates `recipes.image_url`
- [ ] 4.3 Add image picker to recipe detail screen (owner only): tap a "+" icon or the empty image area to launch picker with camera + library options
- [ ] 4.4 Show upload progress indicator during image upload
- [ ] 4.5 After successful upload, immediately display the new image on the detail screen
- [ ] 4.6 Add image display to `RecipeForm.tsx` — show current image at top of form if one exists, with a "Change photo" button

## 5. Mobile Image Display

- [ ] 5.1 Replace React Native `<Image>` with `expo-image` `<Image>` throughout the mobile app (or add it where images don't exist yet)
- [ ] 5.2 Recipe detail screen: add a hero image at the top (16:9 aspect ratio, full width) when `image_url` is present. When no image, content starts immediately (no placeholder).
- [ ] 5.3 Home screen recent recipe cards: show a small thumbnail (64x64, rounded) on the left of each card when `image_url` is present
- [ ] 5.4 Discover screen cards: show image at top of card (16:9 aspect ratio, full width, rounded top corners) when available. Fallback: subtle gradient bg with utensils icon.
- [ ] 5.5 My Recipes screen cards: same image treatment as discover cards
- [ ] 5.6 Public profile recipe cards: add thumbnail to recipe list items
- [ ] 5.7 All images use `expo-image` with `contentFit="cover"`, `transition={200}` (fade-in), and `placeholder` prop with a low-saturation tint matching the brand

## 6. Web App Image Display

- [ ] 6.1 Recipe detail page (`/recipes/[id]`): show hero image at top when available
- [ ] 6.2 Recipe list page (`/recipes`): show thumbnail in each recipe card when available
- [ ] 6.3 Recipe edit page: add image upload button using `<input type="file">`, upload to Supabase Storage, update `image_url`
- [ ] 6.4 Use Next.js `<Image>` component with appropriate `sizes` and `priority` for above-the-fold images

## 7. Fetch image_url in Queries

- [ ] 7.1 Update all mobile Supabase queries that fetch recipes to include `image_url` in the select clause: home screen, discover, my recipes, recipe detail, public profile
- [ ] 7.2 Update all web Supabase queries similarly
- [ ] 7.3 Update TypeScript interfaces for Recipe to include `image_url: string | null`
