## ADDED Requirements

### Requirement: Single typeface system
The design system SHALL use DM Sans as the sole typeface across both web and mobile. Typography hierarchy SHALL be created through font weight (400, 500, 600, 700) and size only. No serif fonts SHALL be used in any UI element.

#### Scenario: Recipe title rendering
- **WHEN** a recipe title is displayed on any screen (list, detail, card)
- **THEN** it SHALL be rendered in DM Sans semibold (600) at the designated heading size

#### Scenario: Section headers
- **WHEN** a section header is displayed (Ingredients, Preparation, Recently Updated)
- **THEN** it SHALL be rendered in DM Sans medium (500), normal case, at 15px
- **AND** it SHALL NOT use uppercase text transform or letter spacing

#### Scenario: Body text
- **WHEN** body text, labels, or captions are displayed
- **THEN** they SHALL be rendered in DM Sans at the appropriate weight (400 for body, 500 for labels)

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

### Requirement: Title-below-image card layout
Recipe cards SHALL display the title below the image, not overlaid on a gradient. The image area and text area SHALL be visually separate zones.

#### Scenario: Recipe card with image
- **WHEN** a recipe card with an image is rendered
- **THEN** the image SHALL fill the top area without any gradient overlay
- **AND** the recipe title SHALL be displayed below the image in the text zone

#### Scenario: Recipe card without image
- **WHEN** a recipe card without an image is rendered
- **THEN** a flat light gray (#F5F5F5) background SHALL fill the image area
- **AND** no gradient, icon, or decorative element SHALL be shown in the placeholder

### Requirement: White web header
The web application header SHALL use a white background with dark text. Navigation links SHALL be rendered in the secondary text color and darken on hover. A 1px bottom border SHALL separate the header from page content.

#### Scenario: Header rendering
- **WHEN** the authenticated layout header is rendered
- **THEN** the background SHALL be white (#FFFFFF)
- **AND** the logo text SHALL be dark (#111111)
- **AND** a 1px border in the border color SHALL appear at the bottom

#### Scenario: Navigation link states
- **WHEN** a navigation link is in its default state
- **THEN** it SHALL be rendered in the secondary text color (#666666)
- **WHEN** a navigation link is hovered
- **THEN** it SHALL darken to the primary text color (#111111)

### Requirement: Pill-shaped buttons
Primary buttons SHALL use border-radius `full` (pill shape) with the teal accent fill and white text. Secondary buttons SHALL use border-radius `full` with a transparent background and a 1px border.

#### Scenario: Primary button rendering
- **WHEN** a primary button is rendered
- **THEN** it SHALL have a fully rounded (pill) shape with teal background and white text

#### Scenario: Secondary button rendering
- **WHEN** a secondary button is rendered
- **THEN** it SHALL have a fully rounded (pill) shape with transparent background and a 1px border
- **AND** the text SHALL be in the secondary text color

### Requirement: Text-based filter tabs
Sort and filter controls SHALL use text-based tabs instead of filled pill buttons. The active state SHALL be indicated by semibold text weight and a 2px bottom underline in the accent color. Inactive tabs SHALL use regular weight in the secondary text color.

#### Scenario: Sort tab active state
- **WHEN** a sort option is selected (e.g., "Recent" in My Recipes)
- **THEN** the selected tab text SHALL be semibold with a 2px teal underline below it
- **AND** all other tabs SHALL be regular weight in secondary text color with no underline

#### Scenario: Filter tab interaction
- **WHEN** a user taps/clicks a filter tab
- **THEN** the previously active tab SHALL lose its underline and return to regular weight
- **AND** the newly selected tab SHALL gain the underline and semibold weight

### Requirement: Content-first home screen
The home screen SHALL lead with content (recent recipes, recommendations) rather than dashboard metrics. The greeting text SHALL be small and understated. The stats grid SHALL be removed.

#### Scenario: Home screen layout
- **WHEN** the home screen is rendered
- **THEN** there SHALL be no stats grid showing recipe counts, favorites, or cooking counts
- **AND** the greeting SHALL be rendered in body-sized secondary text
- **AND** the first prominent content SHALL be the user's recent recipes

### Requirement: Increased spacing
The design system SHALL use increased spacing values to create more breathing room between elements.

#### Scenario: Page-level spacing
- **WHEN** a screen is rendered on mobile
- **THEN** horizontal page padding SHALL be 20px
- **AND** gaps between major content sections SHALL be 32px

#### Scenario: Card content spacing
- **WHEN** content is rendered inside a card
- **THEN** the content padding SHALL be 16px

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
