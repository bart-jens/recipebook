## ADDED Requirements

### Requirement: Fork action on public recipes
The recipe detail page for a public recipe SHALL show a "Fork" action. Tapping it SHALL create a private copy of the recipe in the user's collection. The fork SHALL copy: title, description, instructions, prep_time_minutes, cook_time_minutes, servings, image_url, all ingredients (with quantities, units, names, notes, order), and all tags. The forked recipe SHALL have: `forked_from_id` set to the original recipe ID, `visibility` = 'private', `source_type` = 'fork', `created_by` = current user. The fork operation SHALL be atomic (all-or-nothing).

#### Scenario: Forking a public recipe
- **WHEN** user A taps "Fork" on user B's public recipe "Pad Thai"
- **THEN** a new recipe SHALL be created in user A's collection with all content copied
- **AND** `forked_from_id` SHALL be set to the original recipe ID
- **AND** `visibility` SHALL be 'private'
- **AND** `source_type` SHALL be 'fork'
- **AND** the user SHALL be navigated to their new forked recipe

#### Scenario: Fork copies ingredients
- **GIVEN** the original recipe has 8 ingredients with quantities and notes
- **WHEN** user forks the recipe
- **THEN** all 8 ingredients SHALL be copied to the forked recipe with identical data

#### Scenario: Fork copies tags
- **GIVEN** the original recipe has tags ["Thai", "Noodles", "Quick"]
- **WHEN** user forks the recipe
- **THEN** the forked recipe SHALL have the same tags

#### Scenario: Fork copies image reference
- **GIVEN** the original recipe has an image_url
- **WHEN** user forks the recipe
- **THEN** the forked recipe SHALL have the same image_url

#### Scenario: Fork is independent
- **WHEN** user A forks recipe X and edits the fork's title to "My Pad Thai"
- **THEN** the original recipe X's title SHALL remain unchanged

#### Scenario: Cannot fork own recipe
- **WHEN** user A views their own recipe
- **THEN** the "Fork" action SHALL NOT be shown

#### Scenario: Cannot fork private recipe
- **WHEN** user A views a recipe that is not public
- **THEN** the "Fork" action SHALL NOT be shown

### Requirement: Fork attribution display
A forked recipe's detail page SHALL show attribution to the original recipe. The attribution SHALL display "Forked from [original title] by [creator display_name]" with links to the original recipe and creator profile. If the original recipe has been deleted, the attribution SHALL show "Forked from a recipe that is no longer available."

#### Scenario: Attribution with existing original
- **GIVEN** user A forked recipe "Pad Thai" by user B
- **WHEN** user A views their forked recipe
- **THEN** the detail page SHALL show "Forked from Pad Thai by B"
- **AND** "Pad Thai" SHALL link to the original recipe
- **AND** "B" SHALL link to B's profile

#### Scenario: Attribution after original deleted
- **GIVEN** user A forked recipe X, and recipe X was later deleted (forked_from_id = NULL)
- **WHEN** user A views their forked recipe
- **THEN** the attribution SHALL show "Forked from a recipe that is no longer available"

#### Scenario: No attribution on non-forked recipe
- **WHEN** user views a recipe with forked_from_id = NULL and source_type != 'fork'
- **THEN** no fork attribution SHALL be shown

### Requirement: Fork count on recipe cards
Public recipe cards (on discover page and profile pages) SHALL show the fork count. The fork count is the number of recipes where `forked_from_id` equals this recipe's ID.

#### Scenario: Recipe with forks
- **GIVEN** recipe X has been forked 12 times
- **WHEN** recipe X appears on the discover page
- **THEN** the recipe card SHALL show "12 forks" (or a fork icon with "12")

#### Scenario: Recipe with no forks
- **GIVEN** recipe X has never been forked
- **WHEN** recipe X appears on the discover page
- **THEN** the fork count SHALL show "0" or be hidden

### Requirement: Fork analytics logging
When a recipe is forked, a `recipe_analytics` entry SHALL be created with `event_type` = 'fork', `recipe_id` = the original recipe ID, `user_id` = the forking user.

#### Scenario: Fork logged in analytics
- **WHEN** user A forks recipe X
- **THEN** a recipe_analytics row SHALL be inserted with event_type = 'fork', recipe_id = X, user_id = A

### Requirement: Source type extension for forks
The `source_type` CHECK constraint on the recipes table SHALL be updated to include 'fork' as a valid value. Forked recipes with source_type = 'fork' SHALL be publishable (they are not imports).

#### Scenario: Fork source type allows publishing
- **GIVEN** user A has a forked recipe with source_type = 'fork'
- **WHEN** user A publishes the forked recipe
- **THEN** the visibility update SHALL succeed (not blocked by import restriction)
