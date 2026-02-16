# Recipe Collections

Users can organize recipes into named collections (e.g., "Weeknight Dinners", "Holiday Baking"). Collections are private to the owner. Free users are limited to 5 collections; premium users get unlimited.

---

## ADDED Requirements

### Requirement: Collections table
The database SHALL have a `collections` table with columns: `id` (uuid PK, default gen_random_uuid()), `user_id` (uuid, NOT NULL, FK to auth.users on delete cascade), `name` (text, NOT NULL), `description` (text, nullable), `cover_image_url` (text, nullable), `created_at` (timestamptz, NOT NULL, default now()), `updated_at` (timestamptz, NOT NULL, default now()). An updated_at trigger SHALL be added.

#### Scenario: Creating a collection
- **WHEN** user A creates a collection named "Weeknight Dinners"
- **THEN** a row SHALL be inserted with user_id = A, name = "Weeknight Dinners"

#### Scenario: Renaming a collection
- **WHEN** user A renames collection "Dinners" to "Quick Weeknight Dinners"
- **THEN** the name SHALL be updated and updated_at refreshed

#### Scenario: Deleting a collection
- **WHEN** user A deletes a collection
- **THEN** the collections row SHALL be deleted
- **AND** all collection_recipes entries for that collection SHALL be cascade deleted
- **AND** the recipes themselves SHALL NOT be affected

### Requirement: Collection recipes junction table
The database SHALL have a `collection_recipes` table with columns: `id` (uuid PK, default gen_random_uuid()), `collection_id` (uuid, NOT NULL, FK to collections on delete cascade), `recipe_id` (uuid, NOT NULL, FK to recipes on delete cascade), `added_at` (timestamptz, NOT NULL, default now()). There SHALL be a unique constraint on (collection_id, recipe_id).

#### Scenario: Adding a recipe to a collection
- **WHEN** user A adds recipe X to collection "Weeknight Dinners"
- **THEN** a collection_recipes row SHALL be created

#### Scenario: Cannot add same recipe twice
- **WHEN** user A adds recipe X to collection "Weeknight Dinners" a second time
- **THEN** the insert SHALL be rejected by the unique constraint

#### Scenario: Removing a recipe from a collection
- **WHEN** user A removes recipe X from collection "Weeknight Dinners"
- **THEN** the collection_recipes row SHALL be deleted
- **AND** the recipe itself SHALL NOT be affected

#### Scenario: Recipe deleted removes from collections
- **WHEN** recipe X is deleted
- **THEN** all collection_recipes entries for recipe X SHALL be cascade deleted

#### Scenario: Recipes ordered by added_at
- **WHEN** user views recipes in a collection
- **THEN** recipes SHALL be ordered by added_at descending (newest first)

### Requirement: Collections RLS
RLS SHALL be enabled on both collections and collection_recipes tables. All operations SHALL be scoped to the owner only. Users SHALL only be able to read, create, update, and delete their own collections. Users SHALL only be able to add/remove recipes to their own collections.

#### Scenario: User views own collections
- **WHEN** user A queries collections
- **THEN** only user A's collections SHALL be returned

#### Scenario: User cannot view other users' collections
- **WHEN** user A queries collections
- **THEN** user B's collections SHALL NOT be returned

#### Scenario: User creates own collection
- **WHEN** user A inserts into collections with user_id = A
- **THEN** the insert SHALL succeed

#### Scenario: User cannot create collection for another user
- **WHEN** user A inserts into collections with user_id = B
- **THEN** the insert SHALL be rejected by RLS

#### Scenario: User adds recipe to own collection
- **WHEN** user A adds a recipe to their own collection
- **THEN** the insert into collection_recipes SHALL succeed

#### Scenario: User cannot add recipe to someone else's collection
- **WHEN** user A inserts into collection_recipes for user B's collection
- **THEN** the insert SHALL be rejected by RLS

### Requirement: Free tier collection limit
Free users SHALL be limited to creating a maximum of 5 collections. Premium users SHALL have no limit. The limit SHALL be enforced at both the client (disable create, show upgrade prompt) and database (trigger on insert).

#### Scenario: Free user under limit
- **GIVEN** a free user has 3 collections
- **WHEN** they create a new collection
- **THEN** the insert SHALL succeed

#### Scenario: Free user at limit
- **GIVEN** a free user has 5 collections
- **WHEN** they attempt to create a 6th collection
- **THEN** the insert SHALL be rejected
- **AND** the client SHALL show "Upgrade to Premium for unlimited collections"

#### Scenario: Premium user no limit
- **GIVEN** a premium user has 20 collections
- **WHEN** they create another collection
- **THEN** the insert SHALL succeed

### Requirement: Collections list UI
The web recipe list page and mobile recipes tab SHALL include a "Collections" section. The section SHALL display all user collections as cards showing: collection name, recipe count, and cover image (first recipe's image or placeholder). A "New Collection" button SHALL be shown (disabled with upgrade prompt at free tier limit).

#### Scenario: Viewing collections on web
- **WHEN** user navigates to the recipes page
- **THEN** a "Collections" section SHALL be visible showing all their collections

#### Scenario: Viewing collections on mobile
- **WHEN** user opens the recipes tab on mobile
- **THEN** a "Collections" section SHALL be visible above or below the recipe list

#### Scenario: Collection card display
- **GIVEN** a collection "Date Night" has 8 recipes, the first with a pasta image
- **THEN** the card SHALL show "Date Night", "8 recipes", and the pasta image as cover

#### Scenario: Empty collections section
- **WHEN** user has no collections
- **THEN** a prompt SHALL be shown: "Create your first collection to organize your recipes"

### Requirement: Collection detail view
Tapping a collection SHALL navigate to a detail view showing all recipes in that collection. The view SHALL display the collection name, description (if set), and recipe list. The user SHALL be able to remove recipes from the collection. The view SHALL support search within the collection.

#### Scenario: Viewing a collection
- **WHEN** user taps on collection "Weeknight Dinners"
- **THEN** a page/screen SHALL show all recipes in the collection
- **AND** the collection name SHALL be shown as the page title

#### Scenario: Removing a recipe from collection detail
- **WHEN** user removes recipe X from the collection detail view
- **THEN** the recipe SHALL be removed from the collection
- **AND** the recipe SHALL remain in the user's overall collection

#### Scenario: Searching within a collection
- **WHEN** user searches for "chicken" within collection "Weeknight Dinners"
- **THEN** only recipes in that collection matching "chicken" SHALL be shown

### Requirement: Add to collection action
The recipe detail page SHALL include an "Add to Collection" action. Tapping it SHALL show a list of the user's collections with checkboxes. The user can toggle collections on/off. The action SHALL be available for both owned and saved recipes.

#### Scenario: Adding recipe to collection from detail page
- **WHEN** user taps "Add to Collection" on a recipe and selects "Weeknight Dinners"
- **THEN** a collection_recipes entry SHALL be created
- **AND** the checkbox SHALL show as checked

#### Scenario: Removing recipe from collection via detail page
- **WHEN** user unchecks "Weeknight Dinners" in the collection picker
- **THEN** the collection_recipes entry SHALL be deleted

#### Scenario: Recipe in multiple collections
- **WHEN** user adds recipe X to both "Weeknight Dinners" and "Date Night"
- **THEN** two collection_recipes entries SHALL exist
- **AND** the collection picker SHALL show both as checked

#### Scenario: Creating new collection from picker
- **WHEN** user taps "New Collection" in the collection picker
- **THEN** a quick-create input SHALL appear for entering a collection name
- **AND** the recipe SHALL be added to the new collection after creation
