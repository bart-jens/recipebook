## MODIFIED Requirements

### Requirement: Recipe image storage
The system SHALL store recipe images in Supabase Storage in a `recipe-images` bucket with public read access. Images SHALL be stored at the path `{user_id}/{recipe_id}/{uuid}.webp`. The `recipes` table SHALL have an `image_url` text column containing the public URL of the primary image. **The `recipe_images` table SHALL have an `image_type` column (text, NOT NULL, default 'source', CHECK in: 'source', 'user_upload') to distinguish between images extracted from the recipe source and photos uploaded by the user.**

#### Scenario: Image upload creates storage record
- **WHEN** a user uploads an image for their recipe
- **THEN** the image SHALL be stored in Supabase Storage
- **AND** a row SHALL be inserted in `recipe_images` with `is_primary: true` and `image_type: 'user_upload'`
- **AND** `recipes.image_url` SHALL be updated with the public Storage URL

#### Scenario: Only owner can upload images
- **WHEN** user A attempts to upload an image for a recipe created by user B
- **THEN** the upload SHALL be rejected by RLS policies

#### Scenario: Deleting a recipe removes images
- **WHEN** a recipe is deleted
- **THEN** all associated `recipe_images` rows SHALL be cascade-deleted
- **AND** the stored files SHOULD be cleaned up (via trigger or background job)

#### Scenario: Source image from URL import
- **WHEN** a recipe is imported from a URL with an image
- **THEN** the image SHALL be stored with `image_type: 'source'`

#### Scenario: User uploads their own cooking photo
- **WHEN** a user uploads a photo of a dish they cooked
- **THEN** the image SHALL be stored with `image_type: 'user_upload'`

## ADDED Requirements

### Requirement: Photo carousel with user photo priority
When a recipe has multiple images, the system SHALL display them in a carousel. User-uploaded photos (`image_type: 'user_upload'`) SHALL be displayed before source images (`image_type: 'source'`). Within each type, images SHALL be ordered by `created_at` ascending.

#### Scenario: Recipe with user photos and source thumbnail
- **WHEN** a recipe has 2 user-uploaded photos and 1 source thumbnail
- **THEN** the carousel SHALL show: user photo 1, user photo 2, source thumbnail (in that order)

#### Scenario: Recipe with only source thumbnail
- **WHEN** a recipe has only a source thumbnail and no user photos
- **THEN** the single source thumbnail SHALL be displayed (no carousel needed)

#### Scenario: Recipe with only user photos
- **WHEN** a recipe has user photos but no source thumbnail
- **THEN** the carousel SHALL show only user photos

#### Scenario: Hero image selection
- **WHEN** a recipe has both user photos and source thumbnails
- **THEN** `recipes.image_url` SHALL be set to the first user-uploaded photo (user photos take priority as the hero/primary image)
