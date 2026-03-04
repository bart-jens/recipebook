## ADDED Requirements

### Requirement: Standalone cook log on mobile recipe detail
The mobile recipe detail page SHALL display a "Cooked It" button accessible without entering cooking mode. Tapping it SHALL open an inline form with a date picker (defaulting to today) and an optional notes field. Submitting SHALL insert a row into `recipe_ratings` with `cooked_date` and `notes`. The rating field SHALL be left null when logging without a star rating.

#### Scenario: User logs a cook without rating
- **WHEN** user taps "Cooked It" on the recipe detail
- **THEN** a form appears with a date field (defaulting to today) and a notes text area
- **AND** submitting SHALL insert a `recipe_ratings` row with the selected date and notes

#### Scenario: Date defaults to today
- **WHEN** the "Cooked It" form opens
- **THEN** the date field SHALL show today's date pre-filled

#### Scenario: Notes are optional
- **WHEN** user submits the "Cooked It" form with no notes
- **THEN** the cook log entry SHALL be saved with notes = null

### Requirement: Cook history list on mobile recipe detail
The mobile recipe detail page SHALL display a cook history section listing all `recipe_ratings` rows for the current recipe by the current user, ordered by `cooked_date DESC`. Each entry SHALL show: date (formatted), notes (if present), star rating (if present), and a delete button.

#### Scenario: No cooks logged
- **WHEN** the user has no cook log entries for the recipe
- **THEN** the cook history section shows a "No cooks logged yet" placeholder

#### Scenario: History shows entries in reverse chronological order
- **WHEN** user has logged cooks on March 1 and March 5
- **THEN** March 5 entry appears first

#### Scenario: Entry shows star rating when present
- **WHEN** a cook log entry has a non-null rating
- **THEN** the entry displays the star rating alongside the date and notes

### Requirement: Delete cook log entry on mobile
Each cook history entry on mobile SHALL have a delete action (swipe or button). Deleting SHALL remove the `recipe_ratings` row and immediately update the list.

#### Scenario: User deletes a cook entry
- **WHEN** user deletes a cook log entry
- **THEN** the row is removed from `recipe_ratings`
- **AND** the entry disappears from the history list immediately

#### Scenario: User cancels delete
- **WHEN** user initiates delete but cancels (e.g., dismisses confirmation)
- **THEN** the cook log entry SHALL remain unchanged

### Requirement: Delete star rating from mobile recipe detail
The mobile recipe detail page SHALL allow the recipe owner to delete an existing star rating. A delete option SHALL be available on the rating display. Deleting SHALL update the `recipe_ratings` row to set `rating = null` (preserving cook date and notes) or delete the row if it has no other data.

#### Scenario: User deletes their star rating
- **WHEN** user taps delete on their rating
- **THEN** the rating IS removed from the display
- **AND** if the row has notes or cooked_date, `rating` is set to null
- **AND** if the row has no other data, the row is deleted entirely
