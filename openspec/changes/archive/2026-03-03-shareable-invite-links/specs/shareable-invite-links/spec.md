## ADDED Requirements

### Requirement: Per-user stable invite token
Each user SHALL have a unique, stable `invite_token` (UUID) stored in the `user_invite_tokens` table (separate from `user_profiles` to allow column-level access control). This token SHALL be generated automatically on profile creation and SHALL NOT change unless the user explicitly resets it. The token SHALL NOT be exposed to other users via normal RLS-guarded queries.

#### Scenario: Token generated on profile creation
- **WHEN** a new user profile row is created in `user_profiles`
- **THEN** a `invite_token` UUID SHALL be auto-generated via `gen_random_uuid()`

#### Scenario: Token not visible to other users
- **WHEN** another authenticated user reads a `user_profiles` row
- **THEN** the `invite_token` column SHALL NOT be returned

### Requirement: Invite link route
The web app SHALL expose a route `GET /i/[token]` that accepts a user's `invite_token` and redirects the visitor to the signup page with a pre-filled invite code.

#### Scenario: Valid token generates code and redirects
- **WHEN** a visitor navigates to `https://eefeats.com/i/<valid-token>`
- **THEN** the server SHALL look up the inviter by `invite_token`
- **AND** generate a fresh one-time invite code
- **AND** insert a row into the `invites` table with `invited_by = inviter_id`, `code`, and `used_at = null`
- **AND** redirect `307` to `/signup?code=<code>`

#### Scenario: Invalid or unknown token
- **WHEN** a visitor navigates to `https://eefeats.com/i/<unknown-token>`
- **THEN** the server SHALL redirect to `/signup` without a code parameter

#### Scenario: Each visit generates a unique code
- **WHEN** the same invite link is visited multiple times
- **THEN** each visit SHALL produce a distinct one-time code in the `invites` table

### Requirement: Copy invite link in mobile app
The mobile app SHALL provide a "Copy invite link" button that writes the user's personal invite URL (`https://eefeats.com/i/<invite_token>`) to the device clipboard.

#### Scenario: User copies invite link
- **WHEN** the user taps "Copy invite link" on the invites or profile screen
- **THEN** the string `https://eefeats.com/i/<their invite_token>` SHALL be written to the clipboard
- **AND** a brief confirmation message SHALL be shown (e.g. "Link copied")

#### Scenario: Invite token not yet loaded
- **WHEN** the user's profile data has not yet loaded
- **THEN** the "Copy invite link" button SHALL be disabled or show a loading state
