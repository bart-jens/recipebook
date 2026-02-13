## ADDED Requirements

### Requirement: Fetch and parse recipe URL
The system SHALL fetch the HTML of a provided URL server-side and extract schema.org/Recipe JSON-LD data. The system SHALL parse the structured data into the application's recipe format.

#### Scenario: Valid recipe URL with JSON-LD
- **WHEN** a user submits a URL like "https://www.seriouseats.com/classic-carbonara" that contains schema.org/Recipe JSON-LD
- **THEN** the system SHALL extract the recipe title, description, instructions, ingredients, prep time, cook time, and servings

#### Scenario: URL without recipe markup
- **WHEN** a user submits a URL that does not contain schema.org/Recipe data
- **THEN** the system SHALL display an error: "No recipe found at this URL"

#### Scenario: Invalid URL
- **WHEN** a user submits a malformed URL or unreachable domain
- **THEN** the system SHALL display an error: "Could not fetch this URL"

#### Scenario: Multiple recipes on page
- **WHEN** a page contains multiple schema.org/Recipe entries
- **THEN** the system SHALL use the first recipe found

### Requirement: Parse ingredient strings
The system SHALL parse ingredient strings from schema.org data into structured parts: quantity (decimal), unit, ingredient name, and notes.

#### Scenario: Standard ingredient
- **WHEN** the ingredient string is "2 cups all-purpose flour"
- **THEN** quantity SHALL be 2, unit SHALL be "cups", name SHALL be "all-purpose flour"

#### Scenario: Fractional quantity
- **WHEN** the ingredient string is "1/2 tsp salt"
- **THEN** quantity SHALL be 0.5, unit SHALL be "tsp", name SHALL be "salt"

#### Scenario: Ingredient with notes
- **WHEN** the ingredient string is "3 cloves garlic, minced"
- **THEN** quantity SHALL be 3, unit SHALL be empty, name SHALL be "cloves garlic", notes SHALL be "minced"

#### Scenario: Ingredient without quantity
- **WHEN** the ingredient string is "salt and pepper to taste"
- **THEN** quantity SHALL be null, unit SHALL be empty, name SHALL be "salt and pepper to taste"

### Requirement: Parse ISO 8601 durations
The system SHALL parse ISO 8601 duration strings (e.g., "PT30M", "PT1H15M") from schema.org data into total minutes.

#### Scenario: Minutes only
- **WHEN** the duration is "PT30M"
- **THEN** the result SHALL be 30 minutes

#### Scenario: Hours and minutes
- **WHEN** the duration is "PT1H15M"
- **THEN** the result SHALL be 75 minutes

#### Scenario: Hours only
- **WHEN** the duration is "PT2H"
- **THEN** the result SHALL be 120 minutes

### Requirement: URL import review flow
The system SHALL show a two-step flow: (1) paste URL and submit, (2) review extracted data in the recipe form. The user SHALL be able to edit any field before saving. On save, the recipe SHALL be created with source_type "url" and the original URL stored in source_url.

#### Scenario: Successful import flow
- **WHEN** a user pastes a valid recipe URL, the data is extracted, and they click save
- **THEN** the recipe SHALL be created with source_type "url" and source_url set to the original URL

#### Scenario: Edit before saving
- **WHEN** extracted data is shown in the form and the user changes the title
- **THEN** the modified title SHALL be saved (not the original extracted title)

### Requirement: Handle instruction formats
The system SHALL handle different instruction formats from schema.org: plain text string, array of strings, and array of HowToStep objects.

#### Scenario: Instructions as plain text
- **WHEN** the recipe instructions field is a single string
- **THEN** it SHALL be used as-is

#### Scenario: Instructions as string array
- **WHEN** the recipe instructions field is an array of strings
- **THEN** the strings SHALL be joined with newlines into a single text block

#### Scenario: Instructions as HowToStep array
- **WHEN** the recipe instructions field is an array of objects with "text" properties
- **THEN** the text values SHALL be extracted and joined with newlines
