## MODIFIED Requirements

### Requirement: Image-led recipe cards
Recipe cards in list contexts SHALL use an image-first layout with 4:3 aspect ratio. Cards SHALL provide press feedback through a gentle scale animation (0.98x with spring physics, damping 25, stiffness 200) instead of opacity-only feedback. Cards without images SHALL use a teal wash placeholder (accent at 5% opacity) with the recipe initial in accent color.

#### Scenario: Recipe card press feedback
- **WHEN** a user presses a recipe card
- **THEN** the card SHALL scale to 0.98x with a snappy spring animation
- **AND** release SHALL spring back to 1.0x
- **AND** the animation SHALL run on the native thread

#### Scenario: Recipe card without image
- **WHEN** a recipe card has no image
- **THEN** the placeholder SHALL use a teal wash background (accent at 5% opacity)
- **AND** the initial letter SHALL be rendered in the accent color at 40% opacity

### Requirement: Animated empty states
Empty states SHALL use a branded container with teal wash background (accent at 5%), solid accent/20 border, and a simple FontAwesome icon. No Lottie animations.

#### Scenario: No recipes in My Recipes
- **WHEN** a user with no recipes views the My Recipes tab
- **THEN** an empty state SHALL display with a teal wash container, a book icon, title, and CTA

#### Scenario: No search results
- **WHEN** a search returns no results
- **THEN** an empty state SHALL display with a teal wash container, a search icon, and text

#### Scenario: No cooking log entries
- **WHEN** a recipe has no cooking log entries
- **THEN** a teal wash empty state with a fire icon SHALL encourage the user to cook

## ADDED Requirements

### Requirement: Tab bar active indicator
The tab bar SHALL display a small teal dot (4px diameter circle) below the active tab icon as a visual indicator, in addition to the teal icon color.

#### Scenario: Active tab display
- **WHEN** a tab is the currently active tab
- **THEN** a 4px teal circle SHALL appear below the tab icon
- **AND** the icon SHALL be tinted in the accent color

#### Scenario: Tab selection change
- **WHEN** the user taps a different tab
- **THEN** the newly selected tab icon SHALL bounce (scale 1 to 1.15 to 1) with spring physics
- **AND** the teal dot SHALL appear below the new tab
- **AND** the previous tab's dot SHALL disappear
