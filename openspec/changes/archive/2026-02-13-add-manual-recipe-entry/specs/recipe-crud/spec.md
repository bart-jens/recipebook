## ADDED Requirements

### Requirement: Recipe list page
The system SHALL display a list of all recipes owned by the authenticated user at `/recipes`, sorted by most recently updated. Each list item SHALL show the recipe title, description (truncated), and prep+cook time if available.

#### Scenario: User with recipes
- **WHEN** an authenticated user navigates to `/recipes`
- **THEN** all their recipes SHALL be displayed sorted by `updated_at` descending

#### Scenario: User with no recipes
- **WHEN** an authenticated user with no recipes navigates to `/recipes`
- **THEN** an empty state message SHALL be shown with a link to create a new recipe

#### Scenario: List item display
- **WHEN** a recipe has title "Pasta Carbonara", description "Classic Italian pasta", and cook time 20 minutes
- **THEN** the list item SHALL show the title, a truncated description, and "20 min cook"

### Requirement: Recipe detail page
The system SHALL display a single recipe's full details at `/recipes/[id]`. The page SHALL show: title, description, instructions, prep time, cook time, servings, all ingredients (in order), and source type. The page SHALL include links to edit and delete the recipe.

#### Scenario: View recipe detail
- **WHEN** a user navigates to `/recipes/[id]` for a recipe they own
- **THEN** all recipe fields and ingredients SHALL be displayed

#### Scenario: View recipe not owned
- **WHEN** a user navigates to `/recipes/[id]` for a recipe they do NOT own
- **THEN** a 404 or "not found" page SHALL be shown (RLS prevents access)

### Requirement: Create recipe
The system SHALL allow users to create a new recipe at `/recipes/new`. On successful creation, the user SHALL be redirected to the new recipe's detail page. The `source_type` SHALL be set to "manual" automatically.

#### Scenario: Create recipe with ingredients
- **WHEN** a user fills in the recipe form with title, instructions, and 3 ingredients, then submits
- **THEN** the recipe and all 3 ingredients SHALL be saved and the user SHALL be redirected to the recipe detail page

#### Scenario: Create recipe with minimal fields
- **WHEN** a user fills in only the title and submits
- **THEN** the recipe SHALL be created with title only and all other fields null/empty

### Requirement: Edit recipe
The system SHALL allow users to edit an existing recipe at `/recipes/[id]/edit`. The form SHALL be pre-filled with all current values including ingredients. On successful update, the user SHALL be redirected to the recipe detail page.

#### Scenario: Edit recipe title
- **WHEN** a user changes the title from "Pasta" to "Pasta Carbonara" and submits
- **THEN** the recipe title SHALL be updated and the user SHALL be redirected to the detail page

#### Scenario: Edit ingredients
- **WHEN** a user adds a new ingredient, removes an existing one, and changes another's quantity
- **THEN** all ingredient changes SHALL be persisted correctly

### Requirement: Delete recipe
The system SHALL allow users to delete a recipe. Deletion SHALL require confirmation. On successful deletion, the user SHALL be redirected to the recipe list.

#### Scenario: Delete with confirmation
- **WHEN** a user clicks "Delete" on a recipe detail page
- **THEN** a confirmation prompt SHALL be shown before the recipe is deleted

#### Scenario: Delete cascades
- **WHEN** a recipe is deleted
- **THEN** all associated ingredients, tags, and images SHALL be deleted (via database CASCADE)
