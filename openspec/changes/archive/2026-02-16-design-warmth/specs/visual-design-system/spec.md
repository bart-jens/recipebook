## MODIFIED Requirements

### Requirement: Restrained color palette
The design system SHALL use a neutral palette with teal accent washes for warmth. The teal accent (#2D5F5D) SHALL be used for interactive elements AND as a subtle background wash (5-10% opacity) on empty states, placeholder surfaces, and branded containers. Pure gray (#F5F5F5) remains for generic surfaces. Teal SHALL NOT be used at full saturation for non-interactive backgrounds.

#### Scenario: Interactive element coloring
- **WHEN** a button, link, or active filter state is rendered
- **THEN** the teal accent color at full saturation SHALL be applied

#### Scenario: Empty state container
- **WHEN** an empty state is displayed (no recipes, no activity, no results)
- **THEN** the container SHALL have a teal wash background (accent at 5% opacity)
- **AND** a solid border in accent at 20% opacity
- **AND** the container SHALL NOT use dashed borders

#### Scenario: Recipe card placeholder
- **WHEN** a recipe card has no image
- **THEN** the placeholder area SHALL use a teal wash background (accent at 5% opacity)
- **AND** the initial letter SHALL be rendered in the accent color

#### Scenario: Non-interactive text
- **WHEN** heading text, greeting text, or stat numbers are rendered
- **THEN** they SHALL use the neutral text color (#111111), NOT the accent color

### Requirement: Flat card treatment
Cards throughout the app SHALL NOT use box shadows at rest. On interaction (hover on web, press on mobile), cards SHALL provide tactile feedback through subtle motion rather than opacity change alone.

#### Scenario: Card at rest
- **WHEN** a card is rendered in its default state
- **THEN** the card SHALL have no box shadow
- **AND** the card SHALL use a 1px solid border

#### Scenario: Card hover (web)
- **WHEN** a user hovers over a card on web
- **THEN** the card SHALL translate up by 1px
- **AND** a subtle shadow SHALL appear (0 2px 8px rgba(0,0,0,0.06))

#### Scenario: Card press (mobile)
- **WHEN** a user presses a card on mobile
- **THEN** the card SHALL scale to 0.98x with a snappy spring (damping 25, stiffness 200)
- **AND** release SHALL spring back to 1.0x

## ADDED Requirements

### Requirement: EefEats wordmark logo
The design system SHALL include a custom SVG wordmark where the first "E" incorporates a fork silhouette (the fork tines form the horizontal strokes of the E). The fork-E SHALL be rendered in the teal accent color (#2D5F5D). The remaining letters ("efEats") SHALL use DM Sans Bold in the primary text color (#111111). The wordmark SHALL be used consistently across all logo placements on both platforms.

#### Scenario: Web header logo
- **WHEN** the authenticated layout header is rendered
- **THEN** the EefEats wordmark SVG SHALL be displayed at ~24px height
- **AND** clicking the logo SHALL navigate to the home page

#### Scenario: Login/signup logo
- **WHEN** the login or signup page is rendered on web or mobile
- **THEN** the EefEats wordmark SVG SHALL be displayed at ~48px height
- **AND** it SHALL replace any plain-text "EefEats" heading

#### Scenario: Mobile tab header logo
- **WHEN** the mobile tab bar header is rendered
- **THEN** the EefEats wordmark SVG SHALL be displayed at ~24px height

#### Scenario: App icon
- **WHEN** the app icon is rendered (apple-icon.png, favicon.ico, Expo app icon)
- **THEN** the fork-E mark SHALL be displayed on a teal (#2D5F5D) background
- **AND** the mark SHALL be white

#### Scenario: Logo at small sizes
- **WHEN** the wordmark is rendered below 20px height
- **THEN** the fork-E mark alone MAY be used instead of the full wordmark

### Requirement: Staggered list entry animations
List items (recipe cards, feed items) SHALL animate in with a staggered fade-and-slide effect when first rendered. Animation SHALL be subtle and fast.

#### Scenario: Recipe list loading
- **WHEN** a list of recipe cards finishes loading
- **THEN** each card SHALL fade in with a slight upward slide (8px)
- **AND** each card SHALL be staggered by 30ms from the previous
- **AND** a maximum of 10 items SHALL be animated (remaining appear instantly)

#### Scenario: Feed item entry
- **WHEN** activity feed items are rendered
- **THEN** each item SHALL fade in with a slight upward slide
- **AND** stagger timing SHALL be 30ms per item

### Requirement: Button micro-interactions
Buttons SHALL provide tactile press feedback through scale animation.

#### Scenario: Primary button press (mobile)
- **WHEN** a user presses a primary button on mobile
- **THEN** the button SHALL scale to 0.96x with spring physics
- **AND** release SHALL spring back to 1.0x

#### Scenario: Button press (web)
- **WHEN** a user clicks a button on web
- **THEN** the button SHALL scale to 0.98x during the active state
- **AND** the transition SHALL be 100ms ease

### Requirement: Empty state styling
Empty states SHALL use branded containers with a teal wash background, a simple icon, and clear copy.

#### Scenario: Empty state rendering
- **WHEN** an empty state is displayed
- **THEN** the container SHALL have a teal wash background (accent at 5% opacity)
- **AND** a solid border at accent 20% opacity with rounded corners
- **AND** a simple icon from the existing icon set SHALL be displayed above the title
- **AND** the icon SHALL be rendered in the accent color at 40% opacity
