## ADDED Requirements

### Requirement: User can import recipe from pasted Instagram caption
The system SHALL provide a text input where users can paste an Instagram post caption containing a recipe. The system SHALL extract structured recipe data (title, description, ingredients, instructions, prep time, cook time, servings) from the caption text using the Claude API.

#### Scenario: Successful caption extraction
- **WHEN** user pastes a caption containing recipe ingredients and instructions
- **THEN** system extracts structured recipe data and pre-fills the RecipeForm for review

#### Scenario: Caption with no recipe content
- **WHEN** user pastes a caption that does not contain recipe information
- **THEN** system displays an error message: "No recipe found in the pasted text"

#### Scenario: Caption with partial recipe data
- **WHEN** user pastes a caption with ingredients but no instructions
- **THEN** system extracts available fields and leaves missing fields empty for the user to fill in

### Requirement: User can import recipe from uploaded image
The system SHALL provide a file upload input accepting image files (JPEG, PNG, WebP). The system SHALL send the image to Claude Vision API to extract structured recipe data from recipe card images or screenshots.

#### Scenario: Successful image extraction
- **WHEN** user uploads a clear recipe card image
- **THEN** system sends the image to Claude Vision API, extracts structured recipe data, and pre-fills the RecipeForm

#### Scenario: Unsupported file type
- **WHEN** user attempts to upload a non-image file
- **THEN** system rejects the file with a message: "Please upload an image file (JPEG, PNG, or WebP)"

#### Scenario: Image with no recipe content
- **WHEN** user uploads an image that does not contain recipe information
- **THEN** system displays an error message: "No recipe found in this image"

### Requirement: Instagram import produces standard recipe format
The system SHALL convert extracted Instagram data into the same structured format used by manual entry and URL import: title, description, instructions, prep_time_minutes, cook_time_minutes, servings, and ingredients array (quantity, unit, ingredient_name, notes).

#### Scenario: Consistent output format
- **WHEN** a recipe is extracted from an Instagram caption or image
- **THEN** the output matches the RecipeFormData structure used by the existing RecipeForm component

### Requirement: Instagram import page is accessible from recipe list
The system SHALL add an "Import from Instagram" link on the recipes list page, alongside the existing "Import from URL" and "+ New recipe" buttons.

#### Scenario: Navigation to import page
- **WHEN** user clicks "Import from Instagram" on the recipe list
- **THEN** user is navigated to `/recipes/import-instagram`

### Requirement: Recipes imported from Instagram store source type
The system SHALL save recipes imported via Instagram with `source_type: "instagram"`. **The system SHALL also set `source_name` to the Instagram handle or profile name when available, falling back to "Instagram" when not.**

#### Scenario: Source type is stored
- **WHEN** user saves a recipe imported from Instagram
- **THEN** the recipe record has `source_type` set to `"instagram"`

#### Scenario: Source name from Instagram handle
- **WHEN** user imports a recipe from an Instagram post by @halfbakedharvest
- **THEN** `source_name` SHALL be set to "halfbakedharvest"

#### Scenario: Source name fallback
- **WHEN** user imports a recipe from Instagram but no handle is available
- **THEN** `source_name` SHALL be set to "Instagram"

### Requirement: Claude extraction module is reusable
The system SHALL implement image-to-recipe extraction as a shared module (`src/lib/claude-extract.ts`) that can be reused by the photo-ocr-import feature.

#### Scenario: Module accepts image and returns structured data
- **WHEN** the module is called with a base64-encoded image
- **THEN** it returns structured recipe data matching the standard recipe format or an error
