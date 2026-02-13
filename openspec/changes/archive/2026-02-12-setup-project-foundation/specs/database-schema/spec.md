## ADDED Requirements

### Requirement: Recipes table
The database SHALL have a `recipes` table with columns: `id` (uuid, PK), `title` (text, NOT NULL), `description` (text), `source_url` (text), `source_type` (text, one of: manual, url, photo, telegram), `source_image_path` (text), `instructions` (text), `prep_time_minutes` (integer), `cook_time_minutes` (integer), `servings` (integer), `created_by` (uuid, FK to auth.users), `created_at` (timestamptz), `updated_at` (timestamptz).

#### Scenario: Recipe record creation
- **WHEN** a recipe is inserted with title "Pasta Carbonara" and source_type "manual"
- **THEN** the record SHALL be created with auto-generated `id`, `created_at`, and `updated_at` timestamps

#### Scenario: Source type validation
- **WHEN** a recipe is inserted with source_type "invalid"
- **THEN** the insert SHALL be rejected by a CHECK constraint

### Requirement: Recipe ingredients table
The database SHALL have a `recipe_ingredients` table with columns: `id` (uuid, PK), `recipe_id` (uuid, FK to recipes ON DELETE CASCADE), `ingredient_name` (text, NOT NULL), `quantity` (decimal), `unit` (text), `notes` (text), `order_index` (integer, NOT NULL).

#### Scenario: Ingredient with structured data
- **WHEN** an ingredient is inserted with quantity 2.5, unit "cups", name "flour"
- **THEN** the record SHALL store the decimal quantity precisely

#### Scenario: Recipe deletion cascades to ingredients
- **WHEN** a recipe is deleted
- **THEN** all associated ingredients SHALL be automatically deleted

### Requirement: Recipe ratings table
The database SHALL have a `recipe_ratings` table with columns: `id` (uuid, PK), `recipe_id` (uuid, FK to recipes ON DELETE CASCADE), `user_id` (uuid, FK to auth.users), `rating` (integer, CHECK 1-5), `notes` (text), `cooked_date` (date), `created_at` (timestamptz).

#### Scenario: Valid rating
- **WHEN** a rating of 4 is inserted for a recipe
- **THEN** the record SHALL be created successfully

#### Scenario: Invalid rating value
- **WHEN** a rating of 6 is inserted
- **THEN** the insert SHALL be rejected by the CHECK constraint

### Requirement: Recipe tags table
The database SHALL have a `recipe_tags` table with columns: `id` (uuid, PK), `recipe_id` (uuid, FK to recipes ON DELETE CASCADE), `tag` (text, NOT NULL). There SHALL be a unique constraint on (recipe_id, tag).

#### Scenario: Duplicate tag prevention
- **WHEN** the tag "italian" is added to recipe X twice
- **THEN** the second insert SHALL be rejected by the unique constraint

### Requirement: Recipe images table
The database SHALL have a `recipe_images` table with columns: `id` (uuid, PK), `recipe_id` (uuid, FK to recipes ON DELETE CASCADE), `storage_path` (text, NOT NULL), `is_primary` (boolean, default false), `created_at` (timestamptz).

#### Scenario: Image association
- **WHEN** an image is uploaded for a recipe
- **THEN** the `storage_path` SHALL reference a path in Supabase Storage

### Requirement: Row Level Security on all tables
All tables SHALL have Row Level Security enabled. Users SHALL only be able to read and write data they own. For `recipes`, ownership is determined by `created_by = auth.uid()`. For child tables (`recipe_ingredients`, `recipe_tags`, `recipe_images`), ownership is determined by joining to the parent recipe's `created_by`.

#### Scenario: User reads own recipes
- **WHEN** user A queries the recipes table
- **THEN** only recipes where `created_by` matches user A's ID SHALL be returned

#### Scenario: User cannot read other user's recipes
- **WHEN** user A queries the recipes table
- **THEN** recipes created by user B SHALL NOT be visible

#### Scenario: User reads own recipe's ingredients
- **WHEN** user A queries recipe_ingredients
- **THEN** only ingredients belonging to user A's recipes SHALL be returned

### Requirement: Database migrations
All schema changes SHALL be managed via SQL migration files in `supabase/migrations/`. Migrations SHALL be version-controlled and reproducible.

#### Scenario: Clean database setup
- **WHEN** `supabase db reset` is run
- **THEN** all tables, constraints, and RLS policies SHALL be created from migrations
