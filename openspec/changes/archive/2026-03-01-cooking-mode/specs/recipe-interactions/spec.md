## ADDED Requirements

### Requirement: Cooking mode completion triggers rating prompt
The system SHALL present a soft rating prompt at the end of cooking mode (after the user taps Done on the last step). The prompt SHALL be non-blocking: the user MAY submit a rating or skip. Submitting a rating via the cooking mode completion screen SHALL write to `recipe_ratings` identically to logging a rating from the recipe detail screen.

#### Scenario: Rating submitted from cooking mode completion
- **WHEN** user completes cooking mode and taps Save & Finish with a star rating
- **THEN** a row is inserted into recipe_ratings with: user_id = auth.uid(), recipe_id = the cooked recipe, rating = selected stars, notes = entered text (or null), cooked_date = today's date

#### Scenario: Completion with no rating (skip)
- **WHEN** user completes cooking mode and taps Skip
- **THEN** no row is inserted into recipe_ratings

#### Scenario: Completion with no rating (Save & Finish, no stars selected)
- **WHEN** user taps Save & Finish without selecting any stars
- **THEN** no row is inserted into recipe_ratings

#### Scenario: Rating from cooking mode appears in recipe detail
- **WHEN** user submits a rating via cooking mode completion
- **THEN** the recipe detail screen reflects the new rating upon return (average updated, cook log entry visible)
