# Domain Types

Application-layer TypeScript types shared between the web app (`src/`) and the mobile app (`mobile/`). These types sit on top of the auto-generated Supabase `database.ts` types. The canonical file is `shared/types/domain.ts`.

---

## Requirements

### Requirement: Shared domain type definitions
The system SHALL provide a canonical TypeScript type file at `shared/types/domain.ts` containing application-layer types for core domain objects. Both the web app (`src/`) and the mobile app (`mobile/`) SHALL import from this file using relative paths. No inline type aliases that duplicate these shapes SHALL exist in page or screen files.

#### Scenario: Web imports domain type
- **WHEN** a web page component needs the recipe list item shape
- **THEN** it SHALL import `RecipeListItem` from `shared/types/domain.ts` via relative path
- **AND** no local `interface RecipeListItem` or equivalent SHALL be defined in the same file

#### Scenario: Mobile imports domain type
- **WHEN** a mobile screen needs the recipe list item shape
- **THEN** it SHALL import `RecipeListItem` from `shared/types/domain.ts` via relative path
- **AND** no local interface duplicating the same shape SHALL be defined

### Requirement: RecipeListItem type
The `RecipeListItem` type SHALL represent a recipe as shown in list views on both platforms. It SHALL include: `id`, `title`, `description` (nullable), `image_url` (nullable), `prep_time_minutes` (nullable), `cook_time_minutes` (nullable), `updated_at`, `source_type`, `visibility`, `tags` (string array, flattened from recipe_tags), `avgRating` (number | null), `ratingCount` (number), `isFavorited` (boolean), `hasCooked` (boolean), `isSaved` (boolean).

#### Scenario: Recipe list on web uses RecipeListItem
- **WHEN** the web recipes list page fetches the user's recipe collection
- **THEN** the result SHALL be typed as `RecipeListItem[]`

#### Scenario: Recipe list on mobile uses RecipeListItem
- **WHEN** the mobile recipes tab fetches the user's recipe collection
- **THEN** the result SHALL be typed as `RecipeListItem[]`

### Requirement: PublicRecipe type
The `PublicRecipe` type SHALL represent a recipe in the Discover feed. It SHALL include: `id`, `title`, `description` (nullable), `image_url` (nullable), `prep_time_minutes` (nullable), `cook_time_minutes` (nullable), `published_at` (nullable), `created_by`, `creator_name` (string), `tags` (string array, flattened), `avgRating` (number | null), `ratingCount` (number).

#### Scenario: Discover page uses PublicRecipe
- **WHEN** the discover page fetches public recipes
- **THEN** the enriched results SHALL be typed as `PublicRecipe[]`
- **AND** no local `EnrichedRecipe` or `PublicRecipe` interface SHALL be defined in the page file

### Requirement: ChefListItem type
The `ChefListItem` type SHALL represent a user card shown in chef discovery lists. It SHALL include: `id`, `display_name`, `avatar_url` (nullable), `recipe_count`, `last_cooked` (nullable), `follow_state` (`'not_following' | 'following'`).

#### Scenario: Chef discovery uses ChefListItem
- **WHEN** the discover page fetches a list of chefs
- **THEN** the enriched results SHALL be typed as `ChefListItem[]`

### Requirement: FeedItem type
The `FeedItem` type SHALL represent an activity feed event from the `get_activity_feed()` RPC. It SHALL include: `event_type`, `user_id`, `recipe_id`, `event_at`, `notes` (nullable), `display_name` (nullable — may be null if profile incomplete), `avatar_url` (nullable), `recipe_title`, `recipe_image_url` (nullable), `source_url` (nullable), `source_name` (nullable), `rating` (nullable), `recipe_visibility` (nullable), `recipe_source_type` (nullable).

#### Scenario: Activity feed uses FeedItem
- **WHEN** the home page fetches the activity feed
- **THEN** the results SHALL be typed as `FeedItem[]`

#### Scenario: Null display_name is handled
- **GIVEN** a FeedItem where display_name is null
- **WHEN** the activity feed renders the item
- **THEN** it SHALL display a fallback character (e.g., `?`) instead of crashing
