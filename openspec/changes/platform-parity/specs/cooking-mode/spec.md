## ADDED Requirements

### Requirement: Publish nudge after cooking mode completion on mobile
When the user completes cooking mode on mobile (taps "Done" on the final step), the system SHALL check if the recipe has `visibility = 'private'` AND `source_type = 'manual'`. If so, a native Alert SHALL be shown prompting the user to publish the recipe. The Alert SHALL have two options: "Publish" (calls the existing publish endpoint) and "Not now" (dismisses without action). The nudge SHALL only appear once per cooking session — if the user dismisses it, it SHALL NOT reappear until they enter cooking mode for that recipe again.

#### Scenario: Private manual recipe — nudge appears
- **WHEN** user completes cooking mode on a private manual recipe
- **THEN** an alert appears: "Share with the community?" with "Publish" and "Not now" options

#### Scenario: Private imported recipe — no nudge
- **WHEN** user completes cooking mode on a private imported recipe (source_type != 'manual')
- **THEN** no publish nudge is shown

#### Scenario: Already-public recipe — no nudge
- **WHEN** user completes cooking mode on a recipe with visibility = 'published'
- **THEN** no publish nudge is shown

#### Scenario: User taps Publish
- **WHEN** user selects "Publish" from the nudge alert
- **THEN** the recipe's visibility is updated to 'published'
- **AND** cooking mode dismisses after the publish completes

#### Scenario: User taps Not now
- **WHEN** user selects "Not now" from the nudge alert
- **THEN** no publish action is taken
- **AND** cooking mode dismisses normally
