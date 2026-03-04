## MODIFIED Requirements

### Requirement: Protected routes
All routes except `/login`, `/auth/callback`, and `/i/[token]` SHALL require authentication. Unauthenticated requests to protected routes SHALL redirect to `/login`. The `/auth/callback` route SHALL handle OAuth redirect processing. The `/i/[token]` route SHALL be publicly accessible without authentication.

#### Scenario: Unauthenticated access to protected route
- **WHEN** an unauthenticated user navigates to `/recipes`
- **THEN** they SHALL be redirected to `/login`

#### Scenario: OAuth callback route
- **WHEN** a user is redirected to `/auth/callback` after OAuth
- **THEN** the route SHALL exchange the auth code for a session
- **AND** redirect to the main app (or invite code screen for new users)

#### Scenario: Authenticated access to protected route
- **WHEN** an authenticated user navigates to `/recipes`
- **THEN** the page SHALL render normally

#### Scenario: Invite link route is publicly accessible
- **WHEN** an unauthenticated visitor navigates to `/i/<token>`
- **THEN** the route SHALL process the invite token and redirect to `/signup?code=<code>` without requiring login
