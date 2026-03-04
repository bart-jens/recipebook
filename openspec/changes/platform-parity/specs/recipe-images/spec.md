## ADDED Requirements

### Requirement: Photo carousel on mobile recipe detail
The mobile recipe detail page SHALL query the `recipe_images` table for all images associated with the recipe (ordered `is_primary DESC, created_at ASC`). When multiple images exist, they SHALL be rendered as a horizontally swipeable carousel using a paged `FlatList`. When only one image exists, a static image is shown (no carousel controls). When no images exist, no image section is shown.

#### Scenario: Recipe with multiple images shows carousel
- **WHEN** a recipe has 3 images in recipe_images
- **THEN** the recipe detail shows a swipeable horizontal carousel with 3 pages

#### Scenario: Carousel shows page indicator
- **WHEN** a recipe carousel has more than one image
- **THEN** a dot indicator shows the current page position

#### Scenario: Recipe with one image shows static image
- **WHEN** a recipe has exactly one image in recipe_images
- **THEN** a static image is shown with no swipe controls or dot indicator

#### Scenario: Recipe with no images shows no image section
- **WHEN** a recipe has no images in recipe_images
- **THEN** no image section is rendered on the recipe detail

#### Scenario: Primary image appears first
- **WHEN** a recipe has one primary image and two non-primary images
- **THEN** the primary image appears as the first slide in the carousel
