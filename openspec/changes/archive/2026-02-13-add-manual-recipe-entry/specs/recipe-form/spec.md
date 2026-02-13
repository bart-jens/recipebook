## ADDED Requirements

### Requirement: Recipe form fields
The recipe form SHALL include the following fields: title (required, text), description (optional, textarea), instructions (optional, textarea), prep time in minutes (optional, number), cook time in minutes (optional, number), servings (optional, number).

#### Scenario: Required field validation
- **WHEN** a user submits the form without a title
- **THEN** the form SHALL not submit and the title field SHALL show a validation message

#### Scenario: Number field input
- **WHEN** a user enters prep time as 30
- **THEN** the value SHALL be stored as an integer in minutes

### Requirement: Ingredient table editor
The recipe form SHALL include an ingredient editor that allows adding, removing, and reordering ingredient rows. Each row SHALL have fields: quantity (decimal number, optional), unit (text, optional), ingredient name (text, required), and notes (text, optional).

#### Scenario: Add ingredient row
- **WHEN** a user clicks "Add ingredient"
- **THEN** a new empty ingredient row SHALL be appended to the list

#### Scenario: Remove ingredient row
- **WHEN** a user clicks the remove button on an ingredient row
- **THEN** that row SHALL be removed from the list

#### Scenario: Reorder ingredients
- **WHEN** a user clicks the "move up" button on the third ingredient
- **THEN** it SHALL swap positions with the second ingredient

#### Scenario: Ingredient with all fields
- **WHEN** a user enters quantity "2.5", unit "cups", name "all-purpose flour", notes "sifted"
- **THEN** all four values SHALL be preserved when the form is submitted

### Requirement: Mobile-friendly form layout
The form SHALL use a single-column layout on mobile with large touch targets (minimum 44px height for interactive elements). Input fields SHALL use at least `py-3` padding for comfortable tapping.

#### Scenario: Mobile viewport form
- **WHEN** the form is viewed on a 375px wide screen
- **THEN** all fields SHALL stack vertically with no horizontal scrolling

#### Scenario: Desktop viewport form
- **WHEN** the form is viewed on a 1280px wide screen
- **THEN** time and servings fields MAY display side-by-side

### Requirement: Form error handling
The form SHALL display errors returned from the server inline above the submit button. Errors SHALL be cleared when the user modifies any field.

#### Scenario: Server error display
- **WHEN** a server action returns an error (e.g., database constraint violation)
- **THEN** the error message SHALL be displayed above the submit button

#### Scenario: Error cleared on edit
- **WHEN** an error is displayed and the user modifies any field
- **THEN** the error message SHALL be cleared
