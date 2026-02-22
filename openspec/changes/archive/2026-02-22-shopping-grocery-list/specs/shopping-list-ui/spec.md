## ADDED Requirements

### Requirement: Shopping list page on web
The web app SHALL have a shopping list page at `/shopping-list`. The page SHALL display the user's active shopping list with all items. If the user has no shopping list, one SHALL be auto-created on first visit. The page SHALL be accessible from the main navigation.

#### Scenario: Viewing shopping list on web
- **WHEN** user navigates to /shopping-list
- **THEN** the page SHALL display all items in the user's shopping list
- **AND** checked items SHALL appear below unchecked items, with strikethrough styling

#### Scenario: First visit auto-creates list
- **GIVEN** user has no shopping lists
- **WHEN** user navigates to /shopping-list
- **THEN** a default shopping list named "Shopping List" SHALL be auto-created

#### Scenario: Empty list state
- **GIVEN** user's shopping list has no items
- **WHEN** user views the shopping list page
- **THEN** a prompt SHALL be shown: "Your shopping list is empty. Add ingredients from any recipe to get started."

### Requirement: Shopping list screen on mobile
The mobile app SHALL have a shopping list screen accessible from the home tab (quick action) and from a shopping cart icon in the tab bar or header. The screen SHALL display the active shopping list with check-off UI optimized for one-handed, in-store use.

#### Scenario: Accessing shopping list from home
- **WHEN** user taps the shopping list quick action on the home screen
- **THEN** the shopping list screen SHALL open

#### Scenario: Shopping list item display on mobile
- **WHEN** user views the shopping list on mobile
- **THEN** each item SHALL display: ingredient name (prominent), quantity + unit (secondary), and a large checkbox (minimum 44x44pt tap target)

#### Scenario: Haptic feedback on check
- **WHEN** user checks off an item on mobile
- **THEN** haptic feedback SHALL be triggered
- **AND** the item SHALL animate to the checked section

### Requirement: Check-off UI
The shopping list SHALL support tapping items to toggle their checked state. Unchecked items SHALL appear at the top of the list. Checked items SHALL appear below, visually dimmed with strikethrough text. The checked/unchecked sections SHALL be clearly separated.

#### Scenario: Checking an item
- **WHEN** user taps an unchecked item
- **THEN** the item SHALL move to the checked section with strikethrough styling

#### Scenario: Unchecking an item
- **WHEN** user taps a checked item
- **THEN** the item SHALL move back to the unchecked section with normal styling

#### Scenario: All items checked
- **WHEN** all items are checked
- **THEN** a completion message SHALL be shown (e.g., "All done!")
- **AND** a "Clear Checked" button SHALL be prominent

### Requirement: Add manual item
The shopping list SHALL have an input field at the top for adding items manually. The user SHALL type an ingredient name and press enter/submit to add it. The item SHALL be created with no quantity, no unit, and empty recipe_ids.

#### Scenario: Adding a manual item
- **WHEN** user types "paper towels" and submits
- **THEN** an item SHALL be added to the list with ingredient_name = "paper towels"
- **AND** the input field SHALL be cleared

#### Scenario: Empty input ignored
- **WHEN** user submits with an empty input field
- **THEN** no item SHALL be added

### Requirement: Clear actions
The shopping list page/screen SHALL provide a "Clear Checked" action and a "Clear All" action. "Clear All" SHALL require confirmation before executing.

#### Scenario: Clear Checked action
- **WHEN** user taps "Clear Checked"
- **THEN** all checked items SHALL be removed from the list

#### Scenario: Clear All with confirmation
- **WHEN** user taps "Clear All"
- **THEN** a confirmation dialog SHALL appear: "Clear all items from your shopping list?"
- **AND** confirming SHALL delete all items

#### Scenario: Clear All cancelled
- **WHEN** user taps "Clear All" then cancels
- **THEN** no items SHALL be deleted

### Requirement: Recipe attribution on items
Each shopping list item that originated from a recipe SHALL display a subtle attribution showing the recipe name(s). This helps users understand why an item is on their list.

#### Scenario: Single recipe attribution
- **GIVEN** an item was added from recipe "Pad Thai"
- **THEN** the item SHALL show "from Pad Thai" in secondary text

#### Scenario: Multiple recipe attribution
- **GIVEN** an item "olive oil" was merged from "Pad Thai" and "Caesar Salad"
- **THEN** the item SHALL show "from Pad Thai, Caesar Salad"

#### Scenario: Manual item no attribution
- **GIVEN** an item was added manually
- **THEN** no recipe attribution SHALL be displayed

### Requirement: Edit item quantity
Users SHALL be able to tap on an item's quantity to edit it inline. This allows adjusting quantities after merging or for manual items.

#### Scenario: Editing quantity on web
- **WHEN** user clicks on the quantity "3.5 cups" of an item
- **THEN** an inline edit field SHALL appear allowing quantity and unit changes

#### Scenario: Editing quantity on mobile
- **WHEN** user long-presses an item on mobile
- **THEN** an edit modal SHALL appear with quantity and unit fields

#### Scenario: Removing quantity
- **WHEN** user clears the quantity field
- **THEN** the item SHALL be updated with quantity = null, showing just the ingredient name

### Requirement: Delete individual item
Users SHALL be able to delete individual items from the shopping list via swipe (mobile) or a delete icon (web).

#### Scenario: Swipe to delete on mobile
- **WHEN** user swipes left on a shopping list item
- **THEN** a delete action SHALL be revealed
- **AND** tapping delete SHALL remove the item

#### Scenario: Delete icon on web
- **WHEN** user hovers over a shopping list item on web
- **THEN** a delete icon SHALL appear
- **AND** clicking it SHALL remove the item without confirmation

### Requirement: Shopping list navigation entry
The shopping list SHALL be accessible from the main navigation on both web and mobile. On web, it SHALL appear in the sidebar/header navigation. On mobile, it SHALL be accessible from a quick action on the home screen and optionally from a persistent icon.

#### Scenario: Web navigation
- **WHEN** user views the web sidebar/header
- **THEN** a "Shopping List" link SHALL be visible with an item count badge

#### Scenario: Mobile home quick action
- **WHEN** user views the home screen on mobile
- **THEN** a "Shopping List" quick action SHALL be available showing the current item count

### Requirement: Premium multi-list UI
Premium users SHALL be able to create, name, and switch between multiple shopping lists. The list selector SHALL appear at the top of the shopping list page/screen. Free users SHALL see the single list without a selector.

#### Scenario: Premium user creates named list
- **WHEN** a premium user taps "New List" and enters "Farmers Market"
- **THEN** a new shopping list SHALL be created with that name
- **AND** the user SHALL be switched to viewing the new list

#### Scenario: Switching between lists
- **WHEN** a premium user taps the list selector
- **THEN** a dropdown/sheet SHALL show all their lists
- **AND** tapping a list SHALL switch to viewing it

#### Scenario: Free user sees no list selector
- **WHEN** a free user views their shopping list
- **THEN** no list selector or "New List" button SHALL be shown
