## ADDED Requirements

### Requirement: Recipes/Activity tabs on web public profile
The web public profile page (`/profile/[id]`) SHALL display tab navigation with at least two tabs: "Recipes" and "Activity". The Recipes tab SHALL list the profile owner's published recipes (matching the existing mobile Recipes tab). The Activity tab SHALL list recent cook log entries (cooked_date, recipe title, notes) for the profile owner. For public profiles, both tab contents SHALL be visible to any authenticated user. For private profiles, tab contents SHALL only be visible to approved followers and the profile owner.

#### Scenario: Public profile shows Recipes tab by default
- **WHEN** any authenticated user visits a public profile page
- **THEN** the Recipes tab is active by default, showing the user's published recipes

#### Scenario: User can switch to Activity tab
- **WHEN** user clicks the Activity tab on a public profile
- **THEN** the Activity tab becomes active, showing cook log entries

#### Scenario: Private profile hides tab content from non-followers
- **WHEN** a non-follower visits a private profile
- **THEN** no tab content is shown (tabs may be hidden or show a locked state)

#### Scenario: Profile owner always sees their own tabs
- **WHEN** a user visits their own profile page
- **THEN** both Recipes and Activity tabs are visible with full content

### Requirement: Web onboarding profile setup page
The web app SHALL provide an onboarding page at `/onboarding` for newly signed-up users. The page SHALL display a profile setup form matching the mobile onboarding screen: display name (required), username (unique, availability-checked, 3-30 chars), and avatar upload. Submitting SHALL update `user_profiles` with `display_name`, `username`, `avatar_url`, and `onboarded_at = now()`. After a successful submit, the page SHALL redirect the user to `/tour` if `tour_seen` is absent from `localStorage`, otherwise to `/recipes`. If a user visits `/onboarding` but already has `onboarded_at` set, they SHALL be redirected to `/recipes` immediately.

#### Scenario: New user arrives at onboarding after signup
- **WHEN** a user completes signup and is redirected to /onboarding
- **THEN** the profile setup form is shown

#### Scenario: Onboarding submit redirects to tour on first time
- **WHEN** user completes onboarding and localStorage has no tour_seen key
- **THEN** user is redirected to /tour

#### Scenario: Onboarding submit redirects to recipes if tour already seen
- **WHEN** user completes onboarding and localStorage has tour_seen = true
- **THEN** user is redirected to /recipes

#### Scenario: Returning user bypasses onboarding
- **WHEN** a user with onboarded_at already set navigates to /onboarding
- **THEN** they are immediately redirected to /recipes

### Requirement: App tour shown once after web onboarding
The web app SHALL display a 3-slide walkthrough at `/tour` after the user completes web onboarding. The tour SHALL be a full-page screen (not a modal overlay). Slides SHALL mirror the mobile tour: (1) What is EefEats, (2) Import your recipes, (3) Cook together. Completing or skipping the tour SHALL store `tour_seen = true` in `localStorage` and redirect to `/recipes`. The tour is only reachable via the onboarding redirect — navigating to `/tour` directly after having `tour_seen` set SHALL redirect to `/recipes`.

#### Scenario: Tour shown after onboarding
- **WHEN** a newly onboarded user is redirected to /tour
- **THEN** the 3-slide tour page is displayed

#### Scenario: User can skip the tour
- **WHEN** user clicks "Skip"
- **THEN** tour_seen is stored and user is redirected to /recipes

#### Scenario: Completing the tour redirects to recipes
- **WHEN** user advances through all 3 slides and taps the final CTA
- **THEN** tour_seen is stored and user is redirected to /recipes

#### Scenario: Direct navigation to /tour when already seen
- **WHEN** a user with tour_seen in localStorage navigates to /tour directly
- **THEN** they are redirected to /recipes
