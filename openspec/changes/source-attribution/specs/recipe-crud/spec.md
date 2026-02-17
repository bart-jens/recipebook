## MODIFIED Requirements

### Requirement: Source name input for photo/book imports
When importing a recipe from a photo (source_type = 'photo'), the system SHALL display a dedicated source attribution section on the review screen before the recipe form. The section SHALL prominently feature a book cover scanner button as the primary action, a text input for manual source entry as secondary, and a "Skip for now" link as an explicit opt-out. The book cover scanner SHALL be available on both web and mobile. On web, the scanner SHALL use a file input (camera or file picker); on mobile, it SHALL use the device camera. The source name text input SHALL have placeholder text "e.g. The Food Lab, Ottolenghi Simple". The user SHALL also be able to type a source name manually without scanning.

#### Scenario: User scans book cover to fill source
- **WHEN** user taps "Scan book cover" and photographs the cover of "Salt Fat Acid Heat"
- **THEN** the system SHALL extract the book title via Gemini Vision and pre-fill the source name field with "Salt Fat Acid Heat"

#### Scenario: User enters source name manually
- **WHEN** user imports a recipe from a cookbook photo and types "Ottolenghi Simple" as the source
- **THEN** the recipe SHALL be saved with `source_name` = "Ottolenghi Simple"

#### Scenario: User explicitly skips source
- **WHEN** user imports a recipe from a photo and taps "Skip for now"
- **THEN** the source attribution section SHALL collapse or be dismissed
- **AND** the recipe SHALL be saved with `source_name` = null

#### Scenario: Book cover scan on web
- **WHEN** user clicks the book cover scanner on web and uploads a photo of a cookbook cover
- **THEN** the system SHALL call `/api/extract-book-cover` and pre-fill the source name field with the extracted title

#### Scenario: Book cover scan fails
- **WHEN** the book cover scanner cannot identify a title from the image
- **THEN** the system SHALL show an error message
- **AND** the text input SHALL remain available for manual entry

## ADDED Requirements

### Requirement: Editable source name on recipe edit
The recipe edit form SHALL include a `source_name` text input field on both web and mobile. The field SHALL be pre-filled with the existing `source_name` value. The field SHALL be optional. When the form is submitted, the updated `source_name` SHALL be persisted. The field SHALL appear for all recipe types (manual, photo, url, instagram, fork).

#### Scenario: Editing source name on a photo-imported recipe
- **WHEN** user edits a recipe with `source_type` = 'photo' and `source_name` = "The Food Lab"
- **THEN** the edit form SHALL show a "Source" field pre-filled with "The Food Lab"
- **AND** the user SHALL be able to change it to "The Food Lab by J. Kenji Lopez-Alt"
- **AND** the updated value SHALL be saved

#### Scenario: Adding source name to a recipe that had none
- **WHEN** user edits a recipe with `source_name` = null
- **THEN** the edit form SHALL show an empty "Source" field
- **AND** the user SHALL be able to enter a source name
- **AND** the new value SHALL be saved

#### Scenario: Clearing source name
- **WHEN** user edits a recipe and clears the source name field
- **THEN** `source_name` SHALL be set to null

### Requirement: Book cover API authentication
The `/api/extract-book-cover` endpoint SHALL require authentication. The endpoint SHALL verify the user's session using the same pattern as other extract endpoints (`createClient()` + `auth.getUser()`). Unauthenticated requests SHALL receive a 401 response.

#### Scenario: Authenticated request to book cover API
- **WHEN** an authenticated user sends a POST to `/api/extract-book-cover` with a valid image
- **THEN** the endpoint SHALL process the image and return the extracted title

#### Scenario: Unauthenticated request to book cover API
- **WHEN** an unauthenticated user sends a POST to `/api/extract-book-cover`
- **THEN** the endpoint SHALL return a 401 status with error message "Not authenticated"
