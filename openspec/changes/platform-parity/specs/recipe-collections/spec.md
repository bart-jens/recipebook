## ADDED Requirements

### Requirement: Collection picker on mobile recipe detail
The mobile recipe detail page SHALL display an "Add to collection" button visible only to the recipe owner. Tapping the button SHALL open a bottom sheet listing all of the user's collections, each with a checkmark indicating whether the recipe is already in that collection. Tapping a collection SHALL toggle membership (add if not present, remove if present). The bottom sheet SHALL update immediately on toggle. Closing the sheet requires an explicit dismiss (swipe down or tap backdrop).

#### Scenario: Recipe owner sees Add to collection button
- **WHEN** the current user is the recipe owner
- **THEN** an "Add to collection" button is visible on the recipe detail

#### Scenario: Non-owner does not see collection button
- **WHEN** the current user is not the recipe owner
- **THEN** no "Add to collection" button is shown

#### Scenario: Bottom sheet shows all collections with current membership
- **WHEN** owner taps "Add to collection"
- **THEN** a bottom sheet opens listing all their collections
- **AND** collections that already contain this recipe show a checkmark

#### Scenario: Tapping a collection adds the recipe
- **WHEN** owner taps a collection that does not contain the recipe
- **THEN** a collection_recipes row is inserted
- **AND** the collection gains a checkmark in the bottom sheet immediately

#### Scenario: Tapping a checked collection removes the recipe
- **WHEN** owner taps a collection that already contains the recipe
- **THEN** the collection_recipes row is deleted
- **AND** the checkmark is removed from the collection in the bottom sheet immediately

#### Scenario: User with no collections sees empty state
- **WHEN** user taps "Add to collection" and has no collections
- **THEN** the bottom sheet shows an empty state with a "Create a collection" action

### Requirement: Collection search on web collection detail
The web collection detail page SHALL display a search text input above the recipe list when the collection contains more than 3 recipes. The input SHALL filter the visible recipe list client-side by recipe title (case-insensitive substring match). When the collection has 3 or fewer recipes, no search input is shown.

#### Scenario: Collection with more than 3 recipes shows search input
- **WHEN** a collection contains 5 recipes
- **THEN** a search input is visible above the recipe list

#### Scenario: Collection with 3 or fewer recipes hides search input
- **WHEN** a collection contains 2 recipes
- **THEN** no search input is shown

#### Scenario: Search filters recipe list in real time
- **WHEN** user types "pasta" into the search input
- **THEN** only recipes with "pasta" in the title (case-insensitive) are shown

#### Scenario: No results shows empty state
- **WHEN** search term matches no recipes
- **THEN** an empty state is shown: "No recipes match your search"

#### Scenario: Clearing search restores full list
- **WHEN** user clears the search input
- **THEN** all recipes in the collection are shown again
