## ADDED Requirements

### Requirement: Shared domain type definitions
The system SHALL provide a canonical TypeScript type file at `shared/types/domain.ts` containing application-layer types for the five core domain objects. Both the web app (`src/`) and the mobile app (`mobile/`) SHALL import from this file using relative paths. No inline type aliases that duplicate these shapes SHALL exist in page or screen files.

#### Scenario: Web imports domain type
- **WHEN** a web page component needs the recipe list item shape
- **THEN** it SHALL import `RecipeListItem` from `shared/types/domain.ts` via relative path
- **AND** no local `interface RecipeListItem` or equivalent SHALL be defined in the same file

#### Scenario: Mobile imports domain type
- **WHEN** a mobile screen needs the recipe list item shape
- **THEN** it SHALL import `RecipeListItem` from `shared/types/domain.ts` via relative path
- **AND** no local interface duplicating the same shape SHALL be defined

#### Scenario: No as-unknown-as casts
- **WHEN** a Supabase query returns a result that matches a domain type
- **THEN** the result SHALL be cast directly to the domain type (e.g., `as RecipeListItem[]`)
- **AND** `as unknown as` double-cast SHALL NOT be used

### Requirement: RecipeListItem type
The `RecipeListItem` type SHALL represent a recipe as shown in list views on both platforms. It SHALL include: `id`, `title`, `description` (nullable), `image_url` (nullable), `prep_time_minutes` (nullable), `cook_time_minutes` (nullable), `updated_at`, `source_type`, `visibility`, `created_by`, `recipe_tags` (array of `{ tag: string }`).

#### Scenario: Recipe list on web uses RecipeListItem
- **WHEN** the web recipes list page fetches the user's recipe collection
- **THEN** the result SHALL be typed as `RecipeListItem[]`

#### Scenario: Recipe list on mobile uses RecipeListItem
- **WHEN** the mobile recipes tab fetches the user's recipe collection
- **THEN** the result SHALL be typed as `RecipeListItem[]`

### Requirement: PublicRecipe type
The `PublicRecipe` type SHALL represent a recipe in the Discover feed. It SHALL include: `id`, `title`, `description` (nullable), `image_url` (nullable), `prep_time_minutes` (nullable), `cook_time_minutes` (nullable), `published_at` (nullable), `created_by`, `recipe_tags` (array of `{ tag: string }`), `recipe_ratings` (array of `{ rating: number }`), `creator_name` (string), `avgRating` (number | null), `ratingCount` (number).

#### Scenario: Discover page uses PublicRecipe
- **WHEN** the discover page fetches public recipes
- **THEN** the enriched results SHALL be typed as `PublicRecipe[]`
- **AND** no local `EnrichedRecipe` or `PublicRecipe` interface SHALL be defined in the page file

### Requirement: UserProfile type
The `UserProfile` type SHALL represent a public user profile. It SHALL include: `id`, `display_name` (nullable), `bio` (nullable), `avatar_url` (nullable), `follower_count` (number), `following_count` (number), `recipe_count` (number).

#### Scenario: Profile page uses UserProfile
- **WHEN** the profile page fetches a user's profile data
- **THEN** the result SHALL be typed as `UserProfile`

### Requirement: FeedItem type
The `FeedItem` type SHALL represent an activity feed event. It SHALL include: `id`, `event_type` (union of `'created' | 'saved' | 'cooked' | 'rated'`), `created_at`, `user_id`, `recipe_id` (nullable), `rating` (nullable), `display_name` (nullable), `avatar_url` (nullable), `recipe_title` (nullable), `recipe_image_url` (nullable).

#### Scenario: Activity feed uses FeedItem
- **WHEN** the home page fetches the activity feed
- **THEN** the results SHALL be typed as `FeedItem[]`
