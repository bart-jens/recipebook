## ADDED Requirements

### Requirement: Shopping lists table
The database SHALL have a `shopping_lists` table with columns: `id` (uuid PK, default gen_random_uuid()), `user_id` (uuid, NOT NULL, FK to auth.users on delete cascade), `name` (text, NOT NULL, default 'Shopping List'), `created_at` (timestamptz, NOT NULL, default now()), `updated_at` (timestamptz, NOT NULL, default now()). An updated_at trigger SHALL be added. There SHALL be an index on `user_id`.

#### Scenario: Creating a shopping list
- **WHEN** user A creates a shopping list named "Weekly Groceries"
- **THEN** a row SHALL be inserted with user_id = A, name = "Weekly Groceries"

#### Scenario: Default list name
- **WHEN** user A creates a shopping list without specifying a name
- **THEN** the list SHALL be created with name = "Shopping List"

#### Scenario: Renaming a shopping list
- **WHEN** user A renames their list to "Costco Run"
- **THEN** the name SHALL be updated and updated_at refreshed

#### Scenario: Deleting a shopping list
- **WHEN** user A deletes a shopping list
- **THEN** the shopping_lists row SHALL be deleted
- **AND** all shopping_list_items for that list SHALL be cascade deleted

### Requirement: Shopping list items table
The database SHALL have a `shopping_list_items` table with columns: `id` (uuid PK, default gen_random_uuid()), `shopping_list_id` (uuid, NOT NULL, FK to shopping_lists on delete cascade), `ingredient_name` (text, NOT NULL), `quantity` (decimal, nullable), `unit` (text, nullable), `is_checked` (boolean, NOT NULL, default false), `recipe_ids` (uuid[], NOT NULL, default '{}'), `created_at` (timestamptz, NOT NULL, default now()). There SHALL be an index on `shopping_list_id`.

#### Scenario: Adding an item from a recipe
- **WHEN** recipe X's ingredient "olive oil, 2 tbsp" is added to a shopping list
- **THEN** a shopping_list_items row SHALL be created with ingredient_name = "olive oil", quantity = 2, unit = "tbsp", recipe_ids = '{X}'

#### Scenario: Adding a manual item
- **WHEN** user types "paper towels" into the shopping list
- **THEN** a shopping_list_items row SHALL be created with ingredient_name = "paper towels", quantity = null, unit = null, recipe_ids = '{}'

#### Scenario: Checking off an item
- **WHEN** user taps an unchecked item
- **THEN** is_checked SHALL be set to true

#### Scenario: Unchecking an item
- **WHEN** user taps a checked item
- **THEN** is_checked SHALL be set to false

#### Scenario: Deleting a single item
- **WHEN** user removes an item from the shopping list
- **THEN** the shopping_list_items row SHALL be deleted

### Requirement: Ingredient merging on add
When adding ingredients from a recipe to a shopping list, the system SHALL check each ingredient against existing items. If an item with the same `ingredient_name` (case-insensitive, trimmed) AND the same `unit` (case-insensitive) already exists, the `quantity` SHALL be summed and the recipe ID SHALL be appended to `recipe_ids`. If the ingredient name matches but the unit differs, a separate item SHALL be created. If no match exists, a new item SHALL be created.

#### Scenario: Merging same ingredient and unit
- **GIVEN** shopping list has "flour, 2, cups, recipe_ids = {A}"
- **WHEN** recipe B with "flour, 1.5, cups" is added
- **THEN** the existing item SHALL be updated to quantity = 3.5, recipe_ids = {A, B}

#### Scenario: Different units stay separate
- **GIVEN** shopping list has "butter, 100, g"
- **WHEN** recipe B with "butter, 2, tbsp" is added
- **THEN** a new separate item SHALL be created for "butter, 2, tbsp"
- **AND** the original "butter, 100, g" SHALL remain unchanged

#### Scenario: Case-insensitive matching
- **GIVEN** shopping list has "Olive Oil, 2, tbsp"
- **WHEN** recipe B with "olive oil, 1, tbsp" is added
- **THEN** the existing item SHALL be updated to quantity = 3, preserving the original casing

#### Scenario: Null quantities
- **GIVEN** shopping list has "salt" with quantity = null
- **WHEN** recipe B with "salt, 1, tsp" is added
- **THEN** a new separate item SHALL be created (null quantity cannot be merged)

#### Scenario: Adding same recipe twice does not duplicate
- **GIVEN** recipe A's ingredients were already added to the list
- **WHEN** user adds recipe A to the list again
- **THEN** quantities SHALL be summed again (idempotency is NOT enforced — user may intentionally be doubling a recipe)

### Requirement: Add recipe to shopping list RPC
The database SHALL have an RPC function `add_recipe_to_shopping_list(p_shopping_list_id uuid, p_recipe_id uuid)` that atomically adds all ingredients from the given recipe to the given shopping list, applying merge logic. The function SHALL verify the shopping list belongs to the calling user. The function SHALL return the updated list of shopping_list_items for the list.

#### Scenario: Successfully adding recipe ingredients
- **GIVEN** recipe X has 5 ingredients
- **WHEN** user calls add_recipe_to_shopping_list(list_id, recipe_X_id)
- **THEN** all 5 ingredients SHALL be added (merged or created) in one transaction
- **AND** the updated item list SHALL be returned

#### Scenario: Shopping list belongs to another user
- **WHEN** user A calls add_recipe_to_shopping_list with user B's shopping list
- **THEN** the function SHALL raise an exception

#### Scenario: Recipe has no ingredients
- **WHEN** user calls add_recipe_to_shopping_list for a recipe with 0 ingredients
- **THEN** no items SHALL be added and the function SHALL return the unchanged list

### Requirement: Clear checked items
The system SHALL support clearing all checked items from a shopping list in one operation. This SHALL delete all shopping_list_items rows where is_checked = true for the given list.

#### Scenario: Clearing checked items
- **GIVEN** a shopping list has 8 items, 5 of which are checked
- **WHEN** user taps "Clear Checked"
- **THEN** the 5 checked items SHALL be deleted
- **AND** the 3 unchecked items SHALL remain

#### Scenario: Clear checked with no checked items
- **GIVEN** a shopping list has 4 items, none checked
- **WHEN** user taps "Clear Checked"
- **THEN** no items SHALL be deleted

### Requirement: Clear all items
The system SHALL support clearing all items from a shopping list. This SHALL delete all shopping_list_items rows for the given list.

#### Scenario: Clearing all items
- **GIVEN** a shopping list has 8 items
- **WHEN** user taps "Clear All"
- **THEN** all 8 items SHALL be deleted
- **AND** the shopping list itself SHALL remain (not deleted)

### Requirement: Shopping lists RLS
RLS SHALL be enabled on both `shopping_lists` and `shopping_list_items` tables. All operations SHALL be scoped to the owner only.

#### Scenario: User views own shopping lists
- **WHEN** user A queries shopping_lists
- **THEN** only user A's lists SHALL be returned

#### Scenario: User cannot view other users' lists
- **WHEN** user A queries shopping_lists
- **THEN** user B's lists SHALL NOT be returned

#### Scenario: User creates own shopping list
- **WHEN** user A inserts into shopping_lists with user_id = A
- **THEN** the insert SHALL succeed

#### Scenario: User cannot create list for another user
- **WHEN** user A inserts into shopping_lists with user_id = B
- **THEN** the insert SHALL be rejected by RLS

#### Scenario: User manages items in own list
- **WHEN** user A inserts/updates/deletes items in their own shopping list
- **THEN** the operations SHALL succeed

#### Scenario: User cannot manage items in another user's list
- **WHEN** user A tries to insert/update/delete items in user B's shopping list
- **THEN** the operations SHALL be rejected by RLS

### Requirement: Free tier shopping list limit
Free users SHALL be limited to 1 shopping list. Premium users SHALL have no limit. The limit SHALL be enforced at both the client (hide "New List" button, show upgrade prompt) and the database (RLS insert policy checks user plan and current list count).

#### Scenario: Free user creates first list
- **GIVEN** a free user has 0 shopping lists
- **WHEN** they create a shopping list
- **THEN** the insert SHALL succeed

#### Scenario: Free user at limit
- **GIVEN** a free user has 1 shopping list
- **WHEN** they attempt to create a second list
- **THEN** the insert SHALL be rejected
- **AND** the client SHALL show "Upgrade to Premium for multiple shopping lists"

#### Scenario: Premium user creates multiple lists
- **GIVEN** a premium user has 3 shopping lists
- **WHEN** they create another list
- **THEN** the insert SHALL succeed
