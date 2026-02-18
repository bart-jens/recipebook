## ADDED Requirements

### Requirement: Email/password authentication
The system SHALL support email/password authentication via Supabase Auth. The system SHALL also support Google and Apple OAuth login. Only users with valid invite codes (new signups) or existing accounts (returning users) SHALL be able to access the app. The login page SHALL present social login options alongside the email/password form.

#### Scenario: Successful email login
- **WHEN** a user enters valid email and password on the login page
- **THEN** they SHALL be authenticated and redirected to the main app page

#### Scenario: Successful Google login
- **WHEN** a user clicks "Sign in with Google" and completes the OAuth flow
- **THEN** they SHALL be authenticated and redirected to the main app page

#### Scenario: Successful Apple login
- **WHEN** a user clicks "Sign in with Apple" and completes the OAuth flow
- **THEN** they SHALL be authenticated and redirected to the main app page

#### Scenario: Failed login
- **WHEN** an invalid email or password is submitted
- **THEN** the login page SHALL display an error message without revealing which field was wrong

#### Scenario: OAuth error
- **WHEN** the OAuth flow fails (user cancels, provider error)
- **THEN** the login page SHALL display a generic error message: "Sign in failed. Please try again."

### Requirement: Session management
The system SHALL maintain user sessions using Supabase Auth cookies. Sessions SHALL be automatically refreshed via Next.js middleware on each request.

#### Scenario: Session refresh
- **WHEN** an authenticated user makes a request with a near-expired session
- **THEN** the middleware SHALL refresh the session token transparently

#### Scenario: Session expiry
- **WHEN** a user's session has fully expired and cannot be refreshed
- **THEN** the user SHALL be redirected to the login page

### Requirement: Protected routes
All routes except `/login` and `/auth/callback` SHALL require authentication. Unauthenticated requests to protected routes SHALL redirect to `/login`. The `/auth/callback` route SHALL handle OAuth redirect processing.

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

### Requirement: Logout
The system SHALL provide a logout mechanism that clears the session and redirects to the login page.

#### Scenario: User logs out
- **WHEN** the user clicks the logout button
- **THEN** the session SHALL be cleared and the user SHALL be redirected to `/login`
