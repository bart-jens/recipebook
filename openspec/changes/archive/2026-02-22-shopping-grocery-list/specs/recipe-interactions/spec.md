## ADDED Requirements

### Requirement: Add to Shopping List action on recipe detail
The recipe detail page SHALL show an "Add to Shopping List" action alongside existing actions (Cooked It, Save, Favorite). Tapping it SHALL add all ingredients from the recipe to the user's active shopping list using the merge logic. A confirmation toast SHALL confirm the action with the count of items added. The action SHALL be available for both owned recipes and saved/public recipes.

#### Scenario: Adding recipe ingredients to shopping list on web
- **WHEN** user views recipe "Pad Thai" (which has 8 ingredients) and taps "Add to Shopping List"
- **THEN** all 8 ingredients SHALL be added to the user's active shopping list (with merging)
- **AND** a toast SHALL show "8 ingredients added to Shopping List"

#### Scenario: Adding recipe ingredients to shopping list on mobile
- **WHEN** user views recipe "Pad Thai" on mobile and taps "Add to Shopping List"
- **THEN** all ingredients SHALL be added to the user's active shopping list
- **AND** haptic feedback SHALL be triggered
- **AND** a toast SHALL show "8 ingredients added to Shopping List"

#### Scenario: Merging on add
- **GIVEN** user's shopping list already has "soy sauce, 2, tbsp" from a previous recipe
- **WHEN** user adds recipe "Pad Thai" which also has "soy sauce, 3, tbsp"
- **THEN** the existing item SHALL be updated to "soy sauce, 5, tbsp"
- **AND** the toast SHALL reflect the total items processed

#### Scenario: Adding from a saved public recipe
- **WHEN** user A views user B's public recipe and taps "Add to Shopping List"
- **THEN** the ingredients SHALL be added to user A's shopping list

#### Scenario: No shopping list exists yet
- **GIVEN** user has no shopping list
- **WHEN** user taps "Add to Shopping List" on a recipe
- **THEN** a default shopping list SHALL be auto-created
- **AND** the ingredients SHALL be added to it

#### Scenario: Recipe with no ingredients
- **WHEN** user taps "Add to Shopping List" on a recipe with 0 ingredients
- **THEN** a toast SHALL show "This recipe has no ingredients to add"
