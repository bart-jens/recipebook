## ADDED Requirements

### Requirement: Chefs tab on Discover page
The Discover page SHALL have a segmented control at the top with two options: "Recipes" and "Chefs". The default selection SHALL be "Recipes" (current behavior). When "Chefs" is selected, the page SHALL display a list of all users on the platform, excluding the current user and users already followed by the current user.

#### Scenario: Switching to Chefs tab
- **WHEN** user taps the "Chefs" segment on the Discover page
- **THEN** the recipe list SHALL be replaced with a list of Chef cards
- **AND** the search bar and sort/filter controls SHALL be hidden

#### Scenario: Switching back to Recipes tab
- **WHEN** user taps the "Recipes" segment while viewing Chefs
- **THEN** the Chef list SHALL be replaced with the recipe list
- **AND** the search bar and sort/filter controls SHALL reappear

#### Scenario: Default tab
- **WHEN** user navigates to the Discover page without parameters
- **THEN** the "Recipes" tab SHALL be selected by default

#### Scenario: Deep link to Chefs tab
- **WHEN** user navigates to Discover with a Chefs tab parameter (e.g., from Home empty state CTA)
- **THEN** the "Chefs" tab SHALL be pre-selected

### Requirement: Chef card display
Each Chef in the list SHALL be displayed as a card showing: avatar (with initials fallback), display name, recipe count (total recipes owned), last cooked indicator ("Last cooked X ago" based on most recent cook_log entry), and an inline follow action button.

#### Scenario: Chef card with recent activity
- **GIVEN** Chef B has 12 recipes and last cooked 2 days ago
- **WHEN** the Chefs tab is displayed
- **THEN** Chef B's card SHALL show avatar, "Chef B", "12 recipes", "Last cooked 2 days ago", and a follow button

#### Scenario: Chef card with no cook activity
- **GIVEN** Chef C has 3 recipes and no cook_log entries
- **WHEN** the Chefs tab is displayed
- **THEN** Chef C's card SHALL show avatar, "Chef C", "3 recipes", and no last cooked indicator

#### Scenario: Chef card with zero recipes
- **GIVEN** Chef D has 0 recipes
- **WHEN** the Chefs tab is displayed
- **THEN** Chef D's card SHALL show avatar, "Chef D", "0 recipes", and a follow button

### Requirement: Chef list sorting
The Chef list SHALL be sorted by most recently active first, based on the most recent `cook_log.cooked_at` timestamp. Chefs with no cook_log entries SHALL appear at the bottom of the list.

#### Scenario: Active chefs first
- **GIVEN** Chef A last cooked yesterday and Chef B last cooked a week ago
- **WHEN** the Chefs tab is displayed
- **THEN** Chef A SHALL appear before Chef B

#### Scenario: Inactive chefs at bottom
- **GIVEN** Chef A has cook_log entries and Chef C has none
- **WHEN** the Chefs tab is displayed
- **THEN** Chef C SHALL appear after Chef A

### Requirement: Inline follow button on Chef cards
Each Chef card SHALL include a follow action button. The button SHALL reflect the current follow state and allow immediate follow/unfollow actions without navigating to the Chef's profile.

#### Scenario: Follow a public Chef
- **WHEN** user taps "Follow" on a public Chef's card
- **THEN** a row SHALL be inserted into `user_follows`
- **AND** the button SHALL change to "Following"
- **AND** the Chef card SHALL remain visible in the list

#### Scenario: Request to follow a private Chef
- **WHEN** user taps "Follow" on a private Chef's card
- **THEN** a row SHALL be inserted into `follow_requests`
- **AND** the button SHALL change to "Requested"

#### Scenario: Unfollow from Chef card
- **WHEN** user taps "Following" on a Chef's card
- **THEN** the `user_follows` row SHALL be deleted
- **AND** the button SHALL revert to "Follow"

#### Scenario: Tap Chef card to view profile
- **WHEN** user taps on the Chef card (not the follow button)
- **THEN** the user SHALL be navigated to that Chef's profile page

### Requirement: Invite a Chef CTA
The Chefs tab SHALL display an "Invite a Chef" section at the bottom of the Chef list. The section SHALL include a brief prompt ("Know someone who loves cooking?") and a button that navigates to the invite flow.

#### Scenario: Invite CTA displayed
- **WHEN** user scrolls to the bottom of the Chefs tab
- **THEN** an "Invite a Chef" section SHALL be visible below the Chef list

#### Scenario: Tap invite CTA
- **WHEN** user taps the "Invite a Chef" button
- **THEN** the user SHALL be navigated to the invite creation flow

### Requirement: Chefs tab excludes self and already-followed
The Chefs tab SHALL NOT show the current user in the list. Users the current user already follows SHALL NOT appear in the list (they're already discovered).

#### Scenario: Self excluded
- **WHEN** user views the Chefs tab
- **THEN** their own profile SHALL NOT appear in the list

#### Scenario: Already-followed excluded
- **GIVEN** user A follows Chef B
- **WHEN** user A views the Chefs tab
- **THEN** Chef B SHALL NOT appear in the list

#### Scenario: All chefs followed
- **GIVEN** user A follows every other user on the platform
- **WHEN** user A views the Chefs tab
- **THEN** the list SHALL be empty with a message: "You're following everyone! Invite more Chefs to join."
