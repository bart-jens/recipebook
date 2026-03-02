### Requirement: Ingredient full-text search index
The database SHALL have a GIN index on `recipe_ingredients.ingredient_name` using `to_tsvector('english', ingredient_name)`. A SECURITY DEFINER function `search_recipes_by_ingredient(query text)` SHALL return recipe IDs from the authenticated user's accessible recipe set (owned + saved) whose ingredients match the query. A separate function `search_public_recipes_by_ingredient(query text)` SHALL return recipe IDs from public recipes whose ingredients match.

#### Scenario: Ingredient search finds matching recipe
- **WHEN** a user searches for "lemon" in their recipe collection
- **AND** they have a recipe with ingredient "lemon zest"
- **THEN** `search_recipes_by_ingredient('lemon')` SHALL return that recipe's ID

#### Scenario: Ingredient search is scoped to user's collection
- **WHEN** user A searches for "chicken"
- **AND** user B has a private recipe with chicken but user A has not saved it
- **THEN** the result SHALL NOT include user B's recipe

#### Scenario: Public ingredient search finds public recipes
- **WHEN** `search_public_recipes_by_ingredient('basil')` is called
- **THEN** it SHALL return IDs of public recipes with basil as an ingredient

### Requirement: Recipe search includes ingredient matches
When a user searches their recipe collection on web or mobile, the results SHALL include recipes whose title OR ingredient names match the search query. No separate UI mode is required — title and ingredient matches appear in a single unified result list.

#### Scenario: Search finds recipe by ingredient when title doesn't match
- **WHEN** a user searches for "tahini"
- **AND** they have a recipe titled "Hummus" with ingredient "tahini"
- **THEN** "Hummus" SHALL appear in the search results

#### Scenario: Search finds recipe by title as before
- **WHEN** a user searches for "pasta"
- **AND** they have a recipe titled "Pasta Carbonara" with no pasta ingredient entry
- **THEN** "Pasta Carbonara" SHALL still appear in results

#### Scenario: Discover search includes ingredient matches
- **WHEN** a user searches on the Discover page for "miso"
- **AND** a public recipe "Miso Glazed Salmon" exists with ingredient "white miso"
- **THEN** "Miso Glazed Salmon" SHALL appear in Discover results
