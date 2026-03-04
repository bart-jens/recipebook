## ADDED Requirements

### Requirement: First-launch carousel
The app SHALL show a full-screen onboarding carousel exactly once per user, immediately after profile setup completes. The carousel SHALL be skippable at any point. On completion or skip, the user SHALL be navigated to the main tabs.

#### Scenario: Carousel shown after first profile save
- **WHEN** a new user completes profile setup (display name + username saved)
- **THEN** the app SHALL navigate to the tour screen before entering the main tabs

#### Scenario: Carousel never shown again
- **WHEN** the user has previously completed or skipped the carousel
- **THEN** `/(tabs)` SHALL load directly without showing the tour screen

#### Scenario: Skip exits immediately
- **WHEN** the user taps "Skip" on any slide
- **THEN** the carousel SHALL navigate to `/(tabs)` immediately, marking tour as seen

#### Scenario: Get started on last slide
- **WHEN** the user taps "Get started" on the final slide
- **THEN** the app SHALL navigate to `/(tabs)` and mark tour as seen

### Requirement: Carousel slide content
The carousel SHALL contain exactly 3 slides presented in order: Welcome, Import, Social.

#### Scenario: Slide 1 — Welcome
- **WHEN** the carousel opens
- **THEN** the first slide SHALL show the EefEats logo mark (large), the title "Welcome to EefEats", and the subtitle "Your personal recipe book — everything you cook, all in one place."

#### Scenario: Slide 2 — Import
- **WHEN** the user advances to the second slide
- **THEN** it SHALL show a visual representing recipe import, the title "Import anything", and the subtitle "Grab a recipe from any website, scan a cookbook page, or type it in. It's yours."

#### Scenario: Slide 3 — Social
- **WHEN** the user advances to the third slide
- **THEN** it SHALL show a visual representing social cooking, the title "See what friends cook", and the subtitle "Follow people, rate dishes, and share what's in your kitchen."

### Requirement: Recipes tab empty state
When the authenticated user has no recipes, the recipes tab SHALL display a rich empty state with three distinct import/create actions instead of a blank list.

#### Scenario: Empty recipes list
- **WHEN** the user's recipe list is empty
- **THEN** the tab SHALL show a headline, subtitle, and three action buttons: "Import from a website", "Scan a cookbook photo", and "Add manually"

#### Scenario: Each action navigates correctly
- **WHEN** the user taps "Import from a website"
- **THEN** the app SHALL navigate to `/recipe/import-url`
- **WHEN** the user taps "Scan a cookbook photo"
- **THEN** the app SHALL navigate to `/recipe/import-photo`
- **WHEN** the user taps "Add manually"
- **THEN** the app SHALL navigate to `/recipe/new`

### Requirement: Feed tab empty state
When the authenticated user has no feed activity, the home/feed tab SHALL display a contextual empty state with two CTAs.

#### Scenario: Empty feed
- **WHEN** the user's feed has no items and no suggestions
- **THEN** the tab SHALL show a headline, subtitle, and two actions: primary "Add a recipe" and secondary "Discover recipes"

#### Scenario: Empty feed actions navigate correctly
- **WHEN** the user taps "Add a recipe"
- **THEN** the app SHALL navigate to the recipes tab and open the import menu
- **WHEN** the user taps "Discover recipes"
- **THEN** the app SHALL navigate to the discover tab

### Requirement: Invite screen token error state
When fetching the user's invite token fails, the invite screen SHALL display an inline error message and retry affordance below the copy-link button.

#### Scenario: Token fetch fails
- **WHEN** the `fetchInviteToken` call returns an error
- **THEN** the "Copy invite link" button SHALL remain disabled
- **AND** a message SHALL appear below it: "Couldn't load your invite link"
- **AND** a tappable "Retry" link SHALL appear inline

#### Scenario: Retry re-fetches token
- **WHEN** the user taps "Retry"
- **THEN** `fetchInviteToken` SHALL be called again
- **AND** if successful, the button SHALL become enabled and the error SHALL clear
