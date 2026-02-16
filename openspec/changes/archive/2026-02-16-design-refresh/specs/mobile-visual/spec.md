## MODIFIED Requirements

### Requirement: Image-led recipe cards
Recipe cards in list contexts (Discover, My Recipes, Public Profile) SHALL use an image-first layout: the image fills the top of the card (4:3 aspect ratio), with the title, creator attribution, rating, and metadata displayed below the image in a separate text zone. Cards SHALL NOT use gradient overlays on images. Cards SHALL use a simple opacity change (0.7) on press instead of scale animations.

#### Scenario: Recipe card with image in Discover
- **WHEN** a recipe with an image appears in the Discover list
- **THEN** the card SHALL display the image at the top in 4:3 aspect ratio with no gradient overlay
- **AND** the title and metadata SHALL be rendered below the image
- **AND** pressing the card SHALL trigger an opacity change to 0.7

#### Scenario: Recipe card without image
- **WHEN** a recipe without an image appears in any list
- **THEN** the card SHALL display a flat light gray (#F5F5F5) background in the image area
- **AND** no gradient, icon, or decorative element SHALL appear in the placeholder area
- **AND** the title and metadata SHALL be displayed below in the same layout as image cards

#### Scenario: Compact card variant
- **WHEN** a recipe appears in a secondary context (public profile recipe list, carousel)
- **THEN** a compact card variant SHALL be used with smaller dimensions

### Requirement: Custom serif typography for headings
The app SHALL use DM Sans as the sole typeface for all text. Typography hierarchy SHALL be created through font weight (400 regular, 500 medium, 600 semibold, 700 bold) and size. No serif font SHALL be loaded or used.

#### Scenario: App title
- **WHEN** the user sees the "EefEats" header or login title
- **THEN** the text SHALL be rendered in DM Sans bold

#### Scenario: Recipe title on detail screen
- **WHEN** a user views a recipe detail screen
- **THEN** the recipe title SHALL be rendered in DM Sans semibold at the display size

#### Scenario: Font loading failure
- **WHEN** the DM Sans font fails to load
- **THEN** the app SHALL fall back to the system sans-serif font
- **AND** the app SHALL still render and function normally

### Requirement: Animated empty states
Empty states throughout the app SHALL use simple text with a dashed border container. No Lottie animations, icons, or decorative elements SHALL be used. The empty state SHALL include a title and an optional call-to-action link.

#### Scenario: No recipes in My Recipes
- **WHEN** a user with no recipes views the My Recipes tab
- **THEN** an empty state SHALL be shown with a dashed border container, a text message, and a call-to-action

#### Scenario: No search results
- **WHEN** a search returns no results
- **THEN** an empty state SHALL be shown with text indicating no matches were found

#### Scenario: No cooking log entries
- **WHEN** a recipe has no cooking log entries
- **THEN** a simple text empty state SHALL encourage the user to cook the recipe

## REMOVED Requirements

### Requirement: Celebration animations
**Reason**: Replaced by the simpler, less-is-more design philosophy. Confetti and sparkle overlays conflict with the minimalist direction.
**Migration**: Remove any Lottie celebration animation overlays. Milestone moments can be acknowledged with a brief toast notification instead.
