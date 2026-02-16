## MODIFIED Requirements

### Requirement: Public ratings on canonical recipes
The existing `recipe_ratings` table SHALL work for both personal and canonical recipes. When a recipe is public, all ratings from all users are visible. The recipe card and detail page SHALL show the aggregate average and count. **A user SHALL NOT be able to insert a rating unless they have at least one cook_log entry for that recipe.** This gate SHALL be enforced via RLS policy on insert.

#### Scenario: Aggregate rating display
- **GIVEN** recipe X has ratings of 4, 5, 3 from three users
- **THEN** the displayed average SHALL be 4.0 with count "3 ratings"

#### Scenario: Rating a public recipe after cooking
- **GIVEN** user A has at least one cook_log entry for public recipe X
- **WHEN** user A rates public recipe X with 4 stars and a note
- **THEN** the rating SHALL be visible to all users viewing recipe X

#### Scenario: Rating a public recipe without cooking
- **GIVEN** user A has no cook_log entries for public recipe X
- **WHEN** user A attempts to rate public recipe X
- **THEN** the insert SHALL be rejected by the RLS policy

#### Scenario: Rating own recipe after cooking
- **GIVEN** user A has at least one cook_log entry for their own recipe X
- **WHEN** user A rates recipe X with 5 stars
- **THEN** the rating SHALL be inserted

### Requirement: Activity feed
The system SHALL provide an activity feed showing recent actions by users you follow. Activities include: published a recipe, cooked a recipe (logged a cook_log entry), forked a recipe. The feed SHALL be ordered by recency and paginated. **"Cooked It" events (from cook_log) SHALL be the primary social signal in the feed.**

#### Scenario: Feed shows followed user's cooking activity
- **WHEN** user A follows user B, and user B logs a cook on a recipe
- **THEN** user A's feed SHALL show "B cooked [recipe title]"

#### Scenario: Feed shows followed user's publication
- **WHEN** user A follows user B, and user B publishes a recipe
- **THEN** user A's feed SHALL show "B published [recipe title]"

#### Scenario: Feed excludes unfollowed users
- **WHEN** user A does not follow user C
- **THEN** user C's activity SHALL NOT appear in user A's feed

#### Scenario: Feed shows cooking notes
- **WHEN** user B logs a cook with notes "Added extra chili"
- **THEN** user A's feed entry SHALL include the note text
