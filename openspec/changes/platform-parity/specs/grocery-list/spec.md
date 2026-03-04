## ADDED Requirements

### Requirement: Alphabetical grocery view on web
The web shopping list page SHALL display a view toggle allowing users to switch between "Per recipe" (grouped by source recipe) and "Alphabetical" (merged by ingredient, sorted A-Z). The toggle SHALL be a segmented control or button group. The selected view SHALL be persisted to `localStorage` under the key `grocery_view` and restored on next visit.

#### Scenario: First visit defaults to Per recipe view
- **WHEN** a user opens the web shopping list with no saved preference
- **THEN** Per recipe view is shown by default

#### Scenario: User switches to Alphabetical view
- **WHEN** user selects "Alphabetical" in the toggle
- **THEN** the list re-renders with ingredients merged and sorted A-Z immediately

#### Scenario: Preference persists across page loads
- **WHEN** user selects "Alphabetical" and navigates away then returns
- **THEN** Alphabetical view is restored from localStorage

### Requirement: Web alphabetical view merges ingredients by name and unit
In Alphabetical view on web, items SHALL be merged client-side using the same `mergeByIngredient` logic as mobile. Items with the same normalized ingredient name and unit SHALL be combined with quantities summed. Items with the same ingredient name but different units SHALL remain separate rows. Results SHALL be sorted alphabetically by ingredient name.

#### Scenario: Two recipes share ingredient with same unit
- **WHEN** two recipes each contribute "garlic × 2 cloves"
- **THEN** Alphabetical view shows one row: "garlic × 4 cloves"

#### Scenario: Same ingredient, different units stay separate
- **WHEN** one recipe contributes "butter × 100 g" and another "butter × 2 tbsp"
- **THEN** Alphabetical view shows two separate rows for butter

#### Scenario: Results are sorted A-Z
- **WHEN** the merged list contains "zucchini", "apple", "butter"
- **THEN** they are displayed as "apple", "butter", "zucchini"

### Requirement: Web alphabetical view shows recipe attribution
In Alphabetical view on web, each merged item SHALL show muted attribution below the ingredient name: the source recipe title(s) joined by " · ". Manually added items (no recipe source) show no attribution.

#### Scenario: Item from one recipe shows attribution
- **WHEN** a merged item traces back to one recipe titled "Pasta Bolognese"
- **THEN** "Pasta Bolognese" is shown as muted metadata below the ingredient name

#### Scenario: Item merged from multiple recipes
- **WHEN** a merged item traces back to "Pasta Bolognese" and "Garlic Bread"
- **THEN** "Pasta Bolognese · Garlic Bread" is shown as muted metadata
