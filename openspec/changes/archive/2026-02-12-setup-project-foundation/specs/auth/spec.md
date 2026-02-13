## ADDED Requirements

### Requirement: Email/password authentication
The system SHALL support email/password authentication via Supabase Auth. Only pre-created user accounts SHALL be able to log in. There SHALL be no public registration.

#### Scenario: Successful login
- **WHEN** a pre-created user enters valid email and password on the login page
- **THEN** they SHALL be authenticated and redirected to the main app page

#### Scenario: Failed login
- **WHEN** an invalid email or password is submitted
- **THEN** the login page SHALL display an error message without revealing which field was wrong

#### Scenario: No registration available
- **WHEN** an unauthenticated user visits the app
- **THEN** they SHALL only see a login form with no sign-up option

### Requirement: Session management
The system SHALL maintain user sessions using Supabase Auth cookies. Sessions SHALL be automatically refreshed via Next.js middleware on each request.

#### Scenario: Session refresh
- **WHEN** an authenticated user makes a request with a near-expired session
- **THEN** the middleware SHALL refresh the session token transparently

#### Scenario: Session expiry
- **WHEN** a user's session has fully expired and cannot be refreshed
- **THEN** the user SHALL be redirected to the login page

### Requirement: Protected routes
All routes except `/login` SHALL require authentication. Unauthenticated requests to protected routes SHALL redirect to `/login`.

#### Scenario: Unauthenticated access to protected route
- **WHEN** an unauthenticated user navigates to `/recipes`
- **THEN** they SHALL be redirected to `/login`

#### Scenario: Authenticated access to protected route
- **WHEN** an authenticated user navigates to `/recipes`
- **THEN** the page SHALL render normally

### Requirement: Logout
The system SHALL provide a logout mechanism that clears the session and redirects to the login page.

#### Scenario: User logs out
- **WHEN** the user clicks the logout button
- **THEN** the session SHALL be cleared and the user SHALL be redirected to `/login`
