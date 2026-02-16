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
The design system SHALL use a near-monochrome neutral palette. The teal accent color (#2D5F5D) SHALL be used exclusively for interactive elements (buttons, links, active filter indicators). It SHALL NOT be used for background fills, header bars, stat numbers, or greeting text.

#### Scenario: Interactive element coloring
- **WHEN** a button, link, or active filter state is rendered
- **THEN** the teal accent color SHALL be applied

#### Scenario: Non-interactive text
- **WHEN** heading text, greeting text, or stat numbers are rendered
- **THEN** they SHALL use the neutral text color (#111111), NOT the accent color

#### Scenario: Surface colors
- **WHEN** a surface background is needed (input fields, inactive elements)
- **THEN** the system SHALL use the single surface token (#F5F5F5)
- **AND** there SHALL be no more than one surface gray in the palette

### Requirement: Flat card treatment
Cards throughout the app SHALL NOT use box shadows. Cards SHALL use either a 1px border (#E8E8E8) or no visible container. Content within cards SHALL have 16px padding.

#### Scenario: Recipe card rendering
- **WHEN** a recipe card is rendered in any list or grid context
- **THEN** the card SHALL have no box shadow
- **AND** the card SHALL use a 1px solid border in the border color or no border at all

#### Scenario: Card hover/press state
- **WHEN** a user hovers (web) or presses (mobile) a card
- **THEN** the card SHALL change opacity to 0.7 as feedback
- **AND** the card SHALL NOT scale, bounce, or change shadow

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
