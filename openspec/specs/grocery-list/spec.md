### Requirement: Grocery tab is visible in bottom navigation
The grocery list tab SHALL be a visible, tappable item in the bottom tab bar on mobile. It SHALL appear as the 4th tab (between My Recipes and Profile) with a shopping-cart icon and label "Groceries".

#### Scenario: User opens the app
- **WHEN** an authenticated user opens the app
- **THEN** the bottom tab bar shows 5 tabs: Home, Discover, My Recipes, Groceries, Profile

#### Scenario: User taps Groceries tab
- **WHEN** user taps the Groceries tab icon
- **THEN** the grocery list screen opens directly (no back button, it is a root tab)

---

### Requirement: Grocery list has Planning and Shopping view modes
The grocery list screen SHALL display a toggle allowing users to switch between Planning view (grouped by recipe) and Shopping view (merged by ingredient). The selected mode SHALL persist across app sessions via AsyncStorage.

#### Scenario: First time opening groceries
- **WHEN** a user opens the Groceries tab for the first time (no saved preference)
- **THEN** Planning view is shown by default

#### Scenario: User switches to Shopping view
- **WHEN** user taps "Shopping" in the toggle
- **THEN** the item list re-renders in merged-by-ingredient format immediately

#### Scenario: User switches back to Planning view
- **WHEN** user taps "Planning" in the toggle
- **THEN** the item list re-renders in grouped-by-recipe format immediately

#### Scenario: View preference persists across sessions
- **WHEN** user selects Shopping view and closes the app
- **THEN** on next open, Shopping view is shown without the user having to re-select it

---

### Requirement: Planning view groups items by source recipe
In Planning view, unchecked items SHALL be grouped under their source recipe name as a section header. Items with no recipe source (manually added) SHALL appear in an unlabeled group or under a "Manual" label when other groups exist.

#### Scenario: Items from one recipe
- **WHEN** the list has items from a single recipe
- **THEN** items are listed under that recipe's title with no "Manual" header

#### Scenario: Items from multiple recipes
- **WHEN** the list has items from two or more recipes
- **THEN** each recipe's items appear under that recipe's title as a section header

#### Scenario: Mix of recipe and manual items
- **WHEN** the list has both recipe-sourced and manually added items
- **THEN** recipe items appear under recipe name headers; manual items appear under a "Manual" label

---

### Requirement: Shopping view merges items by ingredient name and unit
In Shopping view, items SHALL be merged client-side by normalized ingredient name + unit. Quantities from merged items SHALL be summed. Items with the same ingredient name but different units SHALL remain separate rows.

#### Scenario: Two recipes share an ingredient with the same unit
- **WHEN** Pasta Bolognese contributes "garlic × 3 cloves" and Stir Fry contributes "garlic × 2 cloves"
- **THEN** Shopping view shows one row: "garlic × 5 cloves"

#### Scenario: Same ingredient, different units
- **WHEN** one recipe contributes "butter × 100 g" and another "butter × 2 tbsp"
- **THEN** Shopping view shows two separate rows for butter

#### Scenario: Manually added items appear in shopping view
- **WHEN** a manually added item has no recipe source
- **THEN** it appears in shopping view as a standalone row with no recipe attribution

---

### Requirement: Shopping view shows recipe attribution per merged item
In Shopping view, each item SHALL display a muted attribution line showing which recipe(s) contributed to it. One recipe → recipe title. Two or more recipes → titles joined by " · ". Manually added items show no attribution.

#### Scenario: Item from one recipe
- **WHEN** a merged item traces back to a single recipe
- **THEN** the recipe title is shown as muted metadata below the ingredient name

#### Scenario: Item merged from multiple recipes
- **WHEN** a merged item traces back to two or more recipes
- **THEN** recipe titles joined by " · " are shown as muted metadata

#### Scenario: Manually added item
- **WHEN** an item has no recipe_ids
- **THEN** no attribution metadata is shown

---

### Requirement: Checking an item in Shopping view marks all underlying rows
In Shopping view, tapping the checkbox on a merged item SHALL toggle the `is_checked` state on ALL underlying DB rows that share the same merge key (ingredient name + unit). Haptic feedback SHALL fire once per toggle action.

#### Scenario: User checks a merged item
- **WHEN** user taps the checkbox on "garlic × 5" in Shopping view (merged from 2 rows)
- **THEN** both underlying garlic rows are marked checked in the DB
- **AND** the item moves to the checked section

#### Scenario: User unchecks a merged item
- **WHEN** user taps the checkbox on a checked merged item in Shopping view
- **THEN** all underlying rows are marked unchecked in the DB
- **AND** the item returns to the unchecked list

---

### Requirement: Deleting an item in Shopping view removes all underlying rows
In Shopping view, deleting a merged item (via the × button) SHALL delete ALL underlying DB rows with the same merge key. The item SHALL be removed from the list with animation.

#### Scenario: User deletes a merged item
- **WHEN** user taps the × button on a merged item in Shopping view
- **THEN** all underlying rows for that ingredient + unit are deleted from the DB
- **AND** the merged row disappears from the list with a fade-out animation
