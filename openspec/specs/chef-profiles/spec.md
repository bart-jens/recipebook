# Chef Profiles

Chef profiles provide a tabbed view of a Chef's activity, favorites, published recipes, and recommendations. The tabs are displayed on the public profile page below the stats row and follow button, with visibility gated by follow status for private profiles.

---

## Requirements

### Requirement: Tabbed profile layout
The Chef profile page (public profile at `/profile/[id]`) SHALL display content in horizontal tabs below the stats row and follow button. The tabs SHALL be: Activity, Favorites, Published, Recommendations. Tab content SHALL only be visible to the profile owner and users who follow the Chef. Non-followers of private profiles SHALL see the existing "This account is private" message instead of tabs.

#### Scenario: Follower views Chef profile
- **GIVEN** user A follows Chef B
- **WHEN** user A visits Chef B's profile
- **THEN** the profile SHALL display tabs: Activity, Favorites, Published, Recommendations
- **AND** the Activity tab SHALL be selected by default

#### Scenario: Non-follower views public Chef profile
- **GIVEN** user A does not follow public Chef B
- **WHEN** user A visits Chef B's profile
- **THEN** the profile SHALL display the same tabs
- **AND** tab content SHALL be visible (public profile, no gate)

#### Scenario: Non-follower views private Chef profile
- **GIVEN** user A does not follow private Chef B
- **WHEN** user A visits Chef B's profile
- **THEN** the tabs SHALL NOT be displayed
- **AND** the "This account is private" message SHALL be shown

#### Scenario: Owner views own profile
- **WHEN** a user views their own profile
- **THEN** all tabs SHALL be visible with their own data

### Requirement: Activity tab
The Activity tab SHALL show the Chef's recent cooking activity from the `cook_log` table. Each entry SHALL display: recipe title (linked to recipe detail), cooked date (relative time), and notes (if present). Entries SHALL be ordered by `cooked_at` descending, paginated at 20 items.

#### Scenario: Activity with notes
- **GIVEN** Chef B cooked "Pasta Carbonara" 2 days ago with notes "Used pecorino instead of parm"
- **WHEN** a follower views Chef B's Activity tab
- **THEN** the entry SHALL show "Pasta Carbonara", "2 days ago", and the notes

#### Scenario: Activity without notes
- **GIVEN** Chef B cooked "Thai Green Curry" last week with no notes
- **WHEN** a follower views Chef B's Activity tab
- **THEN** the entry SHALL show "Thai Green Curry" and "last week" with no notes section

#### Scenario: No activity
- **GIVEN** Chef B has no cook_log entries
- **WHEN** a follower views Chef B's Activity tab
- **THEN** a message SHALL be shown: "No cooking activity yet"

#### Scenario: Activity links to recipe
- **WHEN** a user taps a recipe title in the Activity tab
- **THEN** the user SHALL be navigated to that recipe's detail page

### Requirement: Favorites tab
The Favorites tab SHALL show recipes the Chef has favorited (from `recipe_favorites` table). Each entry SHALL display: recipe title, recipe image (if available), and the Chef's rating for that recipe (from `recipe_ratings`). Entries SHALL be ordered by `recipe_favorites.created_at` descending.

#### Scenario: Favorite with rating
- **GIVEN** Chef B favorited "Sourdough Bread" and rated it 5 stars
- **WHEN** a follower views Chef B's Favorites tab
- **THEN** the entry SHALL show "Sourdough Bread" with a 5-star rating

#### Scenario: No favorites
- **GIVEN** Chef B has no recipe_favorites entries
- **WHEN** a follower views Chef B's Favorites tab
- **THEN** a message SHALL be shown: "No favorite recipes yet"

#### Scenario: Favorite links to recipe
- **WHEN** a user taps a recipe in the Favorites tab
- **THEN** the user SHALL be navigated to that recipe's detail page

### Requirement: Published tab
The Published tab SHALL show the Chef's public recipes (where `visibility = 'public'`). This replaces the current "Public Recipes" section on the profile. Entries SHALL be displayed as recipe cards ordered by `published_at` descending.

#### Scenario: Published recipes displayed
- **GIVEN** Chef B has 3 published recipes
- **WHEN** a follower views Chef B's Published tab
- **THEN** all 3 recipes SHALL be shown as recipe cards

#### Scenario: No published recipes
- **GIVEN** Chef B has no public recipes
- **WHEN** a follower views Chef B's Published tab
- **THEN** a message SHALL be shown: "No published recipes yet"

### Requirement: Recommendations tab
The Recommendations tab SHALL show the Chef's shared recipe recommendations (from `recipe_share_cards` view). This replaces the current "Recommendations" section on the profile. Entries SHALL be displayed as recommendation cards ordered by `shared_at` descending.

#### Scenario: Recommendations displayed
- **GIVEN** Chef B has shared 2 recipe recommendations
- **WHEN** a follower views Chef B's Recommendations tab
- **THEN** both recommendations SHALL be shown as recommendation cards

#### Scenario: No recommendations
- **GIVEN** Chef B has no shared recommendations
- **WHEN** a follower views Chef B's Recommendations tab
- **THEN** a message SHALL be shown: "No recommendations yet"

### Requirement: Chef profile data RPC
The system SHALL provide a `get_chef_profile(p_chef_id uuid)` RPC function that returns the Chef's profile data and tab contents in a single call. The function SHALL check if the calling user follows the Chef and return tab data accordingly. For public profiles, tab data SHALL always be returned. For private profiles, tab data SHALL only be returned if the caller is a follower.

#### Scenario: RPC for followed Chef
- **GIVEN** user A follows Chef B
- **WHEN** user A calls `get_chef_profile(B.id)`
- **THEN** the response SHALL include profile info, stats, and all tab data (activity, favorites, published, recommendations)

#### Scenario: RPC for unfollowed public Chef
- **GIVEN** user A does not follow public Chef B
- **WHEN** user A calls `get_chef_profile(B.id)`
- **THEN** the response SHALL include profile info, stats, and all tab data

#### Scenario: RPC for unfollowed private Chef
- **GIVEN** user A does not follow private Chef B
- **WHEN** user A calls `get_chef_profile(B.id)`
- **THEN** the response SHALL include profile info and stats only
- **AND** tab data arrays SHALL be empty

#### Scenario: RPC for own profile
- **WHEN** user A calls `get_chef_profile(A.id)`
- **THEN** the response SHALL include all data (full access to own profile)
