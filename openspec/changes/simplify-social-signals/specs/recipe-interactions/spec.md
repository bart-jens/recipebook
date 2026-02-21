## ADDED Requirements

### Requirement: Favorite creates feed event
When a user favorites a public recipe, the action SHALL generate a "favorited" event in the activity feed. The event SHALL appear to the user's followers. The event SHALL show the recipe title and thumbnail, with no additional notes or rating data.

#### Scenario: Favoriting a public recipe creates feed event
- **GIVEN** user A follows user B
- **WHEN** user B favorites public recipe X
- **THEN** user A's activity feed SHALL show "B favorited X"

#### Scenario: Favoriting a private recipe does not create feed event
- **WHEN** user B favorites their own private recipe X
- **THEN** no feed event SHALL be created for that favorite

#### Scenario: Unfavoriting removes feed event
- **WHEN** user B unfavorites recipe X
- **THEN** the "favorited" event SHALL no longer appear in the activity feed

### Requirement: Save button on discover cards
The discover page recipe cards SHALL include a "Save" action for recipes not owned by the current user. Tapping "Save" SHALL add the recipe to the user's collection via `saved_recipes`. If already saved, the action SHALL show "Saved" and tapping SHALL unsave.

#### Scenario: Save from discover card
- **WHEN** user A taps "Save" on a discover card for user B's public recipe X
- **THEN** a row SHALL be inserted into saved_recipes with user_id = A, recipe_id = X

#### Scenario: Already saved recipe on discover card
- **GIVEN** user A has saved recipe X
- **WHEN** user A views recipe X on the discover page
- **THEN** the save button SHALL show "Saved" state

#### Scenario: Unsave from discover card
- **GIVEN** user A has saved recipe X
- **WHEN** user A taps the "Saved" button on the discover card
- **THEN** the saved_recipes row SHALL be deleted

## MODIFIED Requirements

### Requirement: Cook log UI on recipe detail
The recipe detail page SHALL show a "Cooked It" action. Tapping it SHALL log a cook event with the current date. An optional notes field SHALL be available. After logging a cook, the rating and favorite actions SHALL become available. The detail page SHALL show the user's cook history for that recipe (list of dates cooked with notes). The cook event SHALL appear in the activity feed with the user's rating shown inline (if rated).

#### Scenario: First cook action on web
- **WHEN** user views a recipe they haven't cooked and taps "Cooked It"
- **THEN** a cook_log entry SHALL be created with today's date
- **AND** the rate and favorite actions SHALL become enabled

#### Scenario: First cook action on mobile
- **WHEN** user views a recipe they haven't cooked and taps "Cooked It" on mobile
- **THEN** a cook_log entry SHALL be created with today's date
- **AND** haptic feedback SHALL be triggered
- **AND** the rate and favorite actions SHALL become enabled

#### Scenario: Cook history display
- **GIVEN** user has cooked recipe X three times
- **WHEN** user views recipe X's detail page
- **THEN** the cook history SHALL show all three dates with any associated notes

#### Scenario: Adding notes to a cook
- **WHEN** user taps "Cooked It" and adds notes "Used half the sugar"
- **THEN** the cook_log entry SHALL include the notes

#### Scenario: Cook event in feed shows rating
- **GIVEN** user B cooked recipe X and rated it 4 stars
- **WHEN** user A (who follows B) views the activity feed
- **THEN** the cook event SHALL show 4 inline stars alongside "B cooked X"

#### Scenario: Cook event in feed shows source attribution
- **GIVEN** user B cooked an imported recipe with source_url "https://seriouseats.com/miso-ramen"
- **WHEN** the cook event appears in the feed
- **THEN** the event SHALL show "via seriouseats.com" as source attribution
