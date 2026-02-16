# Mobile Visual System

The mobile app SHALL deliver a visually rich, animated experience that feels premium and tactile. All animations SHALL run at 60fps on the native thread. The visual system builds on recipe images (prerequisite: `add-recipe-images`) and the shared design system (`mobile/lib/theme.ts`).

---

## ADDED Requirements

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

### Requirement: Parallax hero on recipe detail
The recipe detail screen SHALL display the hero image with a parallax scrolling effect. The image SHALL scroll at half the speed of the content. The navigation header SHALL transition from transparent to solid as the user scrolls past the image.

#### Scenario: Scrolling with parallax
- **WHEN** the user scrolls down on a recipe detail screen with an image
- **THEN** the hero image SHALL move at 0.5x the scroll speed, creating a depth effect

#### Scenario: Header transition
- **WHEN** the user scrolls past the hero image
- **THEN** the navigation header background SHALL transition from transparent to the app's background color
- **AND** the recipe title SHALL fade into the header bar

#### Scenario: Detail screen without image
- **WHEN** a recipe has no image
- **THEN** the parallax hero SHALL not be rendered
- **AND** the content SHALL start at the top of the screen with the normal solid header

### Requirement: Horizontal carousels on home screen
The home screen SHALL display recipe collections in horizontal scrolling carousels. Each carousel SHALL have snap-to-card behavior and a section header with an optional "See all" link.

#### Scenario: Recently Updated carousel
- **WHEN** the user views the home screen
- **THEN** recently updated recipes SHALL be displayed in a horizontal carousel with square-ish cards (4:5 aspect ratio)
- **AND** cards SHALL snap to center alignment on scroll

#### Scenario: Trending This Week carousel
- **WHEN** there are public recipes with recent ratings
- **THEN** a "Trending This Week" carousel SHALL display the top-rated recipes from the last 7 days

#### Scenario: Empty carousel
- **WHEN** a carousel section has no data
- **THEN** the section SHALL not be rendered (no empty carousel)

### Requirement: Skeleton loading screens
All screens SHALL use content-shaped skeleton placeholders during loading instead of spinner indicators. Skeleton shapes SHALL match the layout of the actual content to prevent layout shift.

#### Scenario: Recipe list loading
- **WHEN** the Discover, My Recipes, or Home screen is loading data
- **THEN** skeleton card placeholders SHALL be shown that match the recipe card layout (image block + text lines)
- **AND** the skeletons SHALL have a shimmer animation (gradient sweep left to right)

#### Scenario: Recipe detail loading
- **WHEN** a recipe detail screen is loading
- **THEN** skeleton placeholders SHALL be shown for the hero image, title, metadata pills, and ingredient list

#### Scenario: Content loaded — skeleton removed
- **WHEN** data finishes loading
- **THEN** the skeleton SHALL be replaced with actual content with no layout shift

### Requirement: Animated favorite heart
The favorite heart icon on recipe detail SHALL animate with spring physics when toggled. The animation SHALL include a scale bounce and color transition. Haptic feedback SHALL fire on toggle.

#### Scenario: Toggling favorite on
- **WHEN** the user taps the heart icon to favorite a recipe
- **THEN** the heart SHALL scale from 1.0 to 1.3 and back to 1.0 with spring physics
- **AND** the color SHALL transition from empty to filled (red)
- **AND** a medium haptic impact SHALL fire

#### Scenario: Toggling favorite off
- **WHEN** the user taps the heart icon to unfavorite
- **THEN** the heart SHALL animate back to the empty state
- **AND** a light haptic impact SHALL fire

### Requirement: Haptic feedback for key actions
The app SHALL provide haptic feedback for specific user actions to create a tactile experience. Haptics SHALL gracefully degrade on devices without haptic hardware.

#### Scenario: Cooking log submitted
- **WHEN** a user successfully submits a cooking log entry
- **THEN** a success haptic notification SHALL fire

#### Scenario: Star rating tapped
- **WHEN** a user taps a star in an interactive rating
- **THEN** a selection haptic SHALL fire

#### Scenario: Pull-to-refresh released
- **WHEN** a user releases a pull-to-refresh gesture
- **THEN** a light haptic impact SHALL fire

#### Scenario: Device without haptics
- **WHEN** the device does not support haptic feedback
- **THEN** all haptic calls SHALL silently no-op

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


### Requirement: Staggered entry animations
Content sections on recipe detail and list screens SHALL use staggered fade-in animations when first rendered, creating a polished reveal effect.

#### Scenario: Recipe detail sections
- **WHEN** recipe detail content loads (ingredients, instructions, cooking log)
- **THEN** each section SHALL fade in with a slight upward slide, staggered by 50ms per section

#### Scenario: List items appearing
- **WHEN** a recipe list finishes loading
- **THEN** cards SHALL appear with a staggered fade-in animation (50ms delay per card, up to 8 cards)
