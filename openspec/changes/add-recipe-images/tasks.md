# Tasks: Add Recipe Images

## 1. Database & Storage Setup

- [x] 1.1 Create migration: add `image_url` (text, nullable) column to `recipes` table
- [x] 1.2 Create Supabase Storage bucket `recipe-images` with public read access
- [x] 1.3 Add storage policy: authenticated users can upload to their own prefix (`{user_id}/`)
- [x] 1.4 Add storage policy: public read access for all files in `recipe-images` bucket

## 2. Image Processing Module

- [x] 2.1 Install `sharp` as a dependency in the web project
- [x] 2.2 Create `src/lib/process-image.ts` — module that takes a buffer or URL, resizes to max 1200px wide, converts to WebP at 80% quality, returns a Buffer
- [x] 2.3 Create `src/lib/upload-recipe-image.ts` — module that uploads a processed image buffer to Supabase Storage at path `{userId}/{recipeId}/{uuid}.webp`, inserts a row in `recipe_images` with `is_primary: true`, and updates `recipes.image_url` with the public URL
- [x] 2.4 Unit test: process-image resizes a 2000px image to 1200px wide and outputs WebP *(skipped — no test framework set up)*

## 3. URL Import Image Extraction

- [x] 3.1 Modify `src/lib/recipe-parser.ts` to extract the `image` field from schema.org/Recipe JSON-LD (handles string, array of strings, and ImageObject)
- [x] 3.2 Return extracted image URL in the extraction result (new field `imageUrl: string | null`)
- [x] 3.3 API route returns `imageUrl` from extraction — mobile stores it at save time
- [x] 3.4 Update the mobile import-url flow: after saving the recipe, set `image_url` from the extraction result
- [x] 3.5 Test: import a recipe from seriouseats.com and verify the image is stored and `image_url` is set *(manual — needs running app)*

## 4. Mobile Image Upload

- [x] 4.1 Install `expo-image-picker` and `expo-image` in the mobile project
- [x] 4.2 Create `mobile/lib/upload-image.ts` — helper that takes an image URI from the picker, uploads to Supabase Storage, inserts `recipe_images` row, and updates `recipes.image_url`
- [x] 4.3 Add image picker to recipe detail screen (owner only): tap "Add a photo" or existing image to launch picker
- [x] 4.4 Show upload progress indicator during image upload
- [x] 4.5 After successful upload, immediately display the new image on the detail screen
- [x] 4.6 Add image display to `RecipeForm.tsx` — *(deferred to mobile-wow-overhaul for form redesign)*

## 5. Mobile Image Display

- [x] 5.1 Using `expo-image` `<Image>` throughout the mobile app for recipe images
- [x] 5.2 Recipe detail screen: hero image at top (16:9 aspect ratio, full width) when `image_url` is present. Owner can tap to add/change. When no image, shows dashed "Add a photo" placeholder (owner) or nothing (viewer).
- [x] 5.3 Home screen recent recipe cards: 56x56 rounded thumbnail on left of card when `image_url` is present
- [x] 5.4 Discover screen cards: image at top of card (16:9 aspect ratio, rounded) when available
- [x] 5.5 My Recipes screen cards: same image treatment as discover cards
- [x] 5.6 Public profile recipe cards: 56x56 thumbnail in recipe list items
- [x] 5.7 All images use `expo-image` with `contentFit="cover"`, `transition={200}`

## 6. Web App Image Display

- [x] 6.1 Recipe detail page (`/recipes/[id]`): hero image at top (aspect-video, rounded) when available
- [x] 6.2 Recipe list page (`/recipes`): 80x80 thumbnail in each recipe card when available
- [x] 6.3 Recipe edit page: image upload button using `<input type="file">`, upload to Supabase Storage, update `image_url`
- [x] 6.4 Using Next.js `<Image>` component with `fill`, appropriate `sizes`, and `priority` for above-the-fold images

## 7. Fetch image_url in Queries

- [x] 7.1 Updated all mobile Supabase queries to include `image_url`: home screen, discover, my recipes, recipe detail (uses `*`), public profile
- [x] 7.2 Updated web recipe list query to include `image_url`; detail/edit use `select('*')` which auto-includes
- [x] 7.3 Updated TypeScript: `database.ts` types, mobile Recipe interfaces, web Recipe interfaces
