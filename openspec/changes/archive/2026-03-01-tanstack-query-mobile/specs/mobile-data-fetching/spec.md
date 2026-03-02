## ADDED Requirements

### Requirement: TanStack Query installed and configured
The mobile app SHALL have `@tanstack/react-query` installed. A `QueryClient` SHALL be configured with a 2-minute stale time and 10-minute garbage collection time. A `QueryClientProvider` SHALL wrap the root layout so all screens can access the query client.

#### Scenario: App starts with QueryClientProvider
- **WHEN** the mobile app launches
- **THEN** the root layout SHALL provide a `QueryClientProvider` wrapping all screens
- **AND** any screen SHALL be able to call `useQueryClient()` without error

### Requirement: Centralized query keys
All query cache keys SHALL be defined in `mobile/lib/queries/keys.ts` as typed constants. No screen SHALL use raw string literals as query keys.

#### Scenario: Recipes list query key
- **WHEN** a screen invalidates the recipes list for a user
- **THEN** it SHALL use `queryKeys.recipes(userId)` from `keys.ts`
- **AND** the same key SHALL be used by the query that fetches the recipes list

### Requirement: Typed query functions
Query functions for recipes list, recipe detail, home feed, and discover SHALL be defined in `mobile/lib/queries/`. Each function SHALL return a type from `shared/types/domain.ts`. Query functions SHALL not be defined inline inside screen components.

#### Scenario: Recipes query function returns typed result
- **WHEN** `fetchRecipes(userId, sort, filter)` is called
- **THEN** it SHALL return `Promise<RecipeListItem[]>`

#### Scenario: Recipe detail query function returns typed result
- **WHEN** `fetchRecipeDetail(recipeId)` is called
- **THEN** it SHALL return the full recipe shape with ingredients

### Requirement: Core screens use useQuery
The four primary data-fetching screens SHALL use `useQuery` instead of manual `useEffect + useState`. These screens are: recipes list (`(tabs)/recipes.tsx`), home/feed (`(tabs)/index.tsx`), recipe detail (`recipe/[id]/index.tsx`), and discover (`(tabs)/discover.tsx`).

#### Scenario: Recipes screen serves from cache on re-navigation
- **WHEN** a user navigates from the recipe detail screen back to the recipes list
- **AND** fewer than 2 minutes have elapsed since the last fetch
- **THEN** the recipes list SHALL render instantly from cache without a loading spinner

#### Scenario: Recipes screen refetches stale data in background
- **WHEN** a user navigates back to the recipes list
- **AND** more than 2 minutes have elapsed since the last fetch
- **THEN** the cached data SHALL render immediately
- **AND** a background refetch SHALL occur
- **AND** the list SHALL update when the fresh data arrives

#### Scenario: Discover screen deduplicates requests
- **WHEN** the discover screen mounts
- **AND** the same query is already in flight from a previous mount
- **THEN** only one network request SHALL be made

### Requirement: Focus-based cache invalidation
Screens SHALL use `useFocusEffect` + `queryClient.invalidateQueries()` to mark queries stale when the screen gains focus. This ensures data refreshes after mutations (e.g., editing a recipe, adding to favorites) that happen on other screens.

#### Scenario: Recipes list refreshes after editing a recipe
- **WHEN** a user edits a recipe on the detail screen
- **AND** navigates back to the recipes list
- **THEN** the recipes list SHALL trigger a background refetch to pick up the edit
- **AND** the list SHALL not show a full-screen loading spinner during the refetch

### Requirement: Consistent loading and error states
Every screen using `useQuery` SHALL handle three states: `isLoading` (show skeleton), `isError` (show error message with retry button), and data-ready (show content). The `isLoading` skeleton SHALL match the existing skeleton components already in use.

#### Scenario: Screen shows error with retry on network failure
- **WHEN** a screen's query fails due to a network error
- **THEN** the screen SHALL show an error message
- **AND** a retry button SHALL be available that re-triggers the query

#### Scenario: Screen shows skeleton during initial load
- **WHEN** a screen mounts and no cached data exists
- **THEN** the existing skeleton component SHALL be shown while the query is in flight
