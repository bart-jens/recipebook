# Recipe Images

## Purpose
Recipe images enhance the visual appeal and usability of the platform by showing what dishes look like. Images can be uploaded manually or extracted automatically during URL imports.

## Requirements

### Requirement: Recipe image storage
The system SHALL store recipe images in Supabase Storage in a `recipe-images` bucket with public read access. Images SHALL be stored at the path `{user_id}/{recipe_id}/{uuid}.webp`. The `recipes` table SHALL have an `image_url` text column containing the public URL of the primary image.

#### Scenario: Image upload creates storage record
- **WHEN** a user uploads an image for their recipe
- **THEN** the image SHALL be stored in Supabase Storage
- **AND** a row SHALL be inserted in `recipe_images` with `is_primary: true`
- **AND** `recipes.image_url` SHALL be updated with the public Storage URL

#### Scenario: Only owner can upload images
- **WHEN** user A attempts to upload an image for a recipe created by user B
- **THEN** the upload SHALL be rejected by RLS policies

#### Scenario: Deleting a recipe removes images
- **WHEN** a recipe is deleted
- **THEN** all associated `recipe_images` rows SHALL be cascade-deleted
- **AND** the stored files SHOULD be cleaned up (via trigger or background job)

### Requirement: Image processing
The system SHALL resize uploaded images to a maximum width of 1200px (maintaining aspect ratio) and convert to WebP format at 80% quality before storage.

#### Scenario: Large image upload
- **WHEN** a user uploads a 4000x3000px JPEG image
- **THEN** the stored image SHALL be 1200px wide, in WebP format

#### Scenario: Small image upload
- **WHEN** a user uploads a 800x600px image
- **THEN** the image SHALL not be upscaled, but SHALL be converted to WebP

### Requirement: Image display on mobile recipe cards
Recipe cards throughout the mobile app SHALL display the recipe's hero image when available. Cards in Discover and My Recipes SHALL show the image at the top of the card (16:9 aspect ratio, full card width, rounded top corners). Home screen recent recipe cards SHALL show a small thumbnail (64x64, rounded) on the left.

#### Scenario: Recipe card with image
- **WHEN** a recipe has an `image_url` and appears in the Discover list
- **THEN** the card SHALL display the image at the top in 16:9 aspect ratio with rounded top corners
- **AND** the image SHALL fade in with a 200ms transition

#### Scenario: Recipe card without image
- **WHEN** a recipe has no `image_url` and appears in the Discover list
- **THEN** the card SHALL display a subtle gradient background with a utensils icon placeholder

#### Scenario: Home screen thumbnail
- **WHEN** a recipe with an image appears in the "Recently Updated" section
- **THEN** a 64x64 rounded thumbnail SHALL be shown on the left of the card

### Requirement: Image display on recipe detail screen
The recipe detail screen SHALL show a full-width hero image at the top when available. The image SHALL be 16:9 aspect ratio. When no image is present, the content SHALL start immediately with no placeholder or empty space.

#### Scenario: Detail screen with image
- **WHEN** a user opens a recipe that has an `image_url`
- **THEN** a full-width hero image SHALL be displayed at the top of the scroll view

#### Scenario: Detail screen without image
- **WHEN** a user opens a recipe with no `image_url`
- **THEN** the title and content SHALL start at the top with no gap or placeholder

### Requirement: Mobile image upload
The recipe detail screen SHALL allow the recipe owner to add or change the recipe's image by tapping an icon or the image area. The system SHALL present a picker with camera and photo library options. Images SHALL be compressed client-side before upload.

#### Scenario: Adding an image via camera
- **WHEN** the recipe owner taps the image action and selects "Take photo"
- **THEN** the device camera SHALL open
- **AND** after capture, the photo SHALL be compressed, uploaded, and displayed

#### Scenario: Adding an image via library
- **WHEN** the recipe owner taps the image action and selects "Choose from library"
- **THEN** the photo library picker SHALL open
- **AND** after selection, the photo SHALL be compressed, uploaded, and displayed

#### Scenario: Upload progress
- **WHEN** an image is being uploaded
- **THEN** a progress indicator SHALL be shown until the upload completes

### Requirement: Image extraction during URL import
When importing a recipe from a URL, the system SHALL extract the recipe image from schema.org/Recipe data (the `image` field) and store it alongside the recipe. This SHALL happen automatically with no user action.

#### Scenario: URL with recipe image
- **WHEN** a user imports from a URL that has a schema.org/Recipe with an `image` field
- **THEN** the image SHALL be downloaded, processed, stored, and set as the recipe's primary image

#### Scenario: URL without recipe image
- **WHEN** a user imports from a URL that has no `image` field in the schema.org data
- **THEN** the recipe SHALL be imported normally with no image

#### Scenario: Image download failure
- **WHEN** the recipe image URL is unreachable or returns an error
- **THEN** the recipe SHALL be imported normally with no image
- **AND** no error SHALL be shown to the user (image is best-effort)
