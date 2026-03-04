## MODIFIED Requirements

### Requirement: OAuth callback route
The `/auth/callback` route SHALL handle OAuth redirect processing. For new users, it SHALL redirect to the invite code verification screen. If an `invite_code` query param was passed in the callback URL (via `redirectTo`), the callback SHALL forward it to `/signup/verify-invite?code=<code>`.

#### Scenario: OAuth callback route for new user with invite code in URL
- **WHEN** a new user is redirected to `/auth/callback?invite_code=XXXXXXXX` after Apple OAuth
- **AND** the callback URL contains an `invite_code` query param
- **THEN** the route SHALL exchange the auth code for a session
- **AND** detect that this is a new user (identity created within the last 2 minutes)
- **AND** redirect to `/signup/verify-invite?code=<invite_code>`

#### Scenario: OAuth callback route for new user without invite code in URL
- **WHEN** a new user is redirected to `/auth/callback` after Apple OAuth
- **AND** the callback URL contains no `invite_code` query param
- **THEN** the route SHALL redirect to `/signup/verify-invite` with no code param

#### Scenario: OAuth callback route for returning user
- **WHEN** a returning user is redirected to `/auth/callback` after Apple OAuth
- **THEN** the route SHALL exchange the auth code for a session
- **AND** redirect to `/recipes` (or the `next` query param if present)

#### Scenario: OAuth error
- **WHEN** the OAuth flow fails or returns no auth code
- **THEN** the route SHALL redirect to `/login?error=auth`

## ADDED Requirements

### Requirement: Verify-invite page accepts pre-filled code
The `/signup/verify-invite` page SHALL accept an optional `code` query parameter. When present, the invite code input SHALL be pre-filled with that value and the form SHALL auto-submit on mount. If auto-submission fails (invalid or used code), the page SHALL display the error and allow manual correction.

#### Scenario: Verify-invite with valid pre-filled code
- **WHEN** a user arrives at `/signup/verify-invite?code=XXXXXXXX`
- **AND** the code is valid and unused
- **THEN** the page SHALL auto-submit the invite code without user interaction
- **AND** redirect the user to `/recipes`

#### Scenario: Verify-invite with invalid pre-filled code
- **WHEN** a user arrives at `/signup/verify-invite?code=XXXXXXXX`
- **AND** the code is invalid or already used
- **THEN** the page SHALL display the appropriate error message
- **AND** the input SHALL remain editable for the user to enter a different code

#### Scenario: Verify-invite with no pre-filled code
- **WHEN** a user arrives at `/signup/verify-invite` with no `code` query param
- **THEN** the input SHALL be empty and the user SHALL enter their code manually
