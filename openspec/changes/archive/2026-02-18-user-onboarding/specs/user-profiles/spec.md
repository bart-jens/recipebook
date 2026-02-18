## MODIFIED Requirements

### Requirement: Profile editing
The system SHALL allow authenticated users to edit their own profile. Editable fields: display_name (required, non-empty), username (unique, 3-30 chars, lowercase alphanumeric + underscores), avatar_url, bio (max 300 characters), and is_private (boolean). Changes SHALL update the `updated_at` timestamp.

#### Scenario: Updating display name
- **WHEN** user updates their display_name to "Maria's Kitchen"
- **THEN** the profile SHALL be updated with the new display_name
- **AND** `updated_at` SHALL be refreshed

#### Scenario: Updating username
- **WHEN** user updates their username to "maria_kitchen"
- **THEN** the profile SHALL be updated with the new username
- **AND** `updated_at` SHALL be refreshed

#### Scenario: Username uniqueness on edit
- **WHEN** user tries to update their username to one that already exists
- **THEN** the update SHALL be rejected with a validation error

#### Scenario: Empty display name rejected
- **WHEN** user submits an empty display_name
- **THEN** the update SHALL be rejected with a validation error

#### Scenario: Bio length limit
- **WHEN** user submits a bio longer than 300 characters
- **THEN** the update SHALL be rejected with a validation error
