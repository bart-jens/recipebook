## MODIFIED Requirements

### Requirement: Profile Activity tab visibility
The `get_chef_profile` RPC Activity tab SHALL only return cook_log entries for recipes where `visibility = 'public'` OR `created_by = caller`. Private recipes owned by third parties SHALL NOT appear.

#### Scenario: Viewing another user's activity with mixed visibility recipes
- **WHEN** user A views user B's profile
- **AND** user B has cooked both public and private recipes
- **THEN** only cook_log entries for public recipes are shown
- **AND** entries for private recipes owned by other users are hidden

#### Scenario: Viewing own profile with private recipes
- **WHEN** user A views their own profile
- **AND** user A has cooked their own private recipes
- **THEN** those entries appear in the activity tab

### Requirement: Profile Favorites tab visibility
The `get_chef_profile` RPC Favorites tab SHALL only return favorites for recipes where `visibility = 'public'` OR `created_by = caller`. Private recipes owned by third parties SHALL NOT appear.

#### Scenario: Viewing another user's favorites with private recipes
- **WHEN** user A views user B's profile
- **AND** user B has favorited private recipes owned by user C
- **THEN** those favorites are hidden from user A

#### Scenario: Viewing own favorites with own private recipes
- **WHEN** user A views their own profile
- **AND** user A has favorited their own private recipe
- **THEN** that favorite appears in the tab

### Requirement: Recipe detail private recipe message
When a recipe exists but is inaccessible due to visibility restrictions, the detail page SHALL display "This recipe is private" instead of a generic "not found" message. This applies to both web and mobile.

#### Scenario: Clicking a private recipe on web
- **WHEN** a user navigates to a recipe detail page for a private recipe they don't own
- **THEN** the page displays "This recipe is private" with a back link

#### Scenario: Clicking a private recipe on mobile
- **WHEN** a user navigates to a recipe detail screen for a private recipe they don't own
- **THEN** the screen displays "This recipe is private" with a back button
