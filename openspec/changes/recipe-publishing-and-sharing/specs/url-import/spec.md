## MODIFIED Requirements

### Requirement: Fetch and parse recipe URL
The system SHALL fetch the HTML of a provided URL server-side and extract schema.org/Recipe JSON-LD data. The system SHALL parse the structured data into the application's recipe format, **including the recipe image when available**. **The system SHALL also extract and store a `source_name` derived from the URL domain.**

#### Scenario: Valid recipe URL with JSON-LD
- **WHEN** a user submits a URL like "https://www.seriouseats.com/classic-carbonara" that contains schema.org/Recipe JSON-LD
- **THEN** the system SHALL extract the recipe title, description, instructions, ingredients, prep time, cook time, and servings
- **AND** `source_name` SHALL be set to "Serious Eats" (derived from domain)

#### Scenario: Valid recipe URL with JSON-LD and image
- **WHEN** a user submits a URL that contains schema.org/Recipe JSON-LD with an `image` field
- **THEN** the system SHALL extract the recipe title, description, instructions, ingredients, prep time, cook time, servings, **and image URL**
- **AND** the extracted image SHALL be downloaded, resized, converted to WebP, and uploaded to Supabase Storage
- **AND** the resulting Storage URL SHALL be set as the recipe's `image_url`

#### Scenario: Valid recipe URL without image
- **WHEN** a user submits a URL that contains schema.org/Recipe JSON-LD without an `image` field
- **THEN** the recipe SHALL be extracted normally with `image_url` set to null

#### Scenario: Image field is an array
- **WHEN** the schema.org `image` field is an array of URLs
- **THEN** the system SHALL use the first URL in the array

#### Scenario: Image field is an ImageObject
- **WHEN** the schema.org `image` field is an object with a `url` property
- **THEN** the system SHALL extract the URL from the `url` property

#### Scenario: URL without recipe markup
- **WHEN** a user submits a URL that does not contain schema.org/Recipe data
- **THEN** the system SHALL display an error: "No recipe found at this URL"

#### Scenario: Invalid URL
- **WHEN** a user submits a malformed URL or unreachable domain
- **THEN** the system SHALL display an error: "Could not fetch this URL"

#### Scenario: Multiple recipes on page
- **WHEN** a page contains multiple schema.org/Recipe entries
- **THEN** the system SHALL use the first recipe found

#### Scenario: Source name derivation from common domains
- **WHEN** a recipe is imported from "https://www.bonappetit.com/recipe/..."
- **THEN** `source_name` SHALL be set to "Bon Appetit"

#### Scenario: Source name fallback to raw domain
- **WHEN** a recipe is imported from an unrecognized domain "https://joes-kitchen.blog/..."
- **THEN** `source_name` SHALL be set to "joes-kitchen.blog"
