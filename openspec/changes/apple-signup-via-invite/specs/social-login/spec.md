## MODIFIED Requirements

### Requirement: Social login UI
The login and signup screens SHALL show social login buttons above the email/password form, separated by an "or" divider. The Apple button SHALL follow Apple's Human Interface Guidelines (black background, Apple logo). The Google button SHALL follow Google's branding guidelines. The signup page (`/signup`) SHALL show a "Sign up with Apple" button. The login page (`/login`) SHALL continue to show "Sign in with Apple". The Google button SHALL remain hidden on both pages until a custom domain is configured.

#### Scenario: Login page layout
- **WHEN** a user visits the login page
- **THEN** a "Sign in with Apple" button SHALL be displayed above the email/password form
- **AND** an "or" divider SHALL separate the Apple button from the email form

#### Scenario: Signup page layout
- **WHEN** a user visits the signup page
- **THEN** a "Sign up with Apple" button SHALL be displayed above the email/password form
- **AND** an "or" divider SHALL separate the Apple button from the email/password/invite-code form

#### Scenario: Mobile login screen layout
- **WHEN** a user opens the mobile app login screen
- **THEN** "Sign in with Apple" SHALL be displayed
- **AND** the layout SHALL match the web login page structure

## MODIFIED Requirements

### Requirement: Invite code check for social signups
New users signing up via social login SHALL still be required to provide a valid invite code. The invite code check SHALL happen after OAuth completes but before granting app access. When signing up via Apple from the signup page, the invite code SHALL be carried through the `redirectTo` URL as a query param so the verify-invite step can be pre-filled and auto-submitted.

#### Scenario: New user via Apple from signup page with invite code in URL
- **WHEN** a user arrives at `/signup?code=XXXXXXXX` and taps "Sign up with Apple"
- **THEN** the invite code SHALL be appended as `invite_code=XXXXXXXX` to the OAuth `redirectTo` URL
- **AND** after Apple authorization, the user SHALL be redirected to `/signup/verify-invite?code=XXXXXXXX`
- **AND** the invite code SHALL be pre-filled and auto-submitted
- **AND** the user SHALL be redirected to `/recipes` without manually entering the code

#### Scenario: New user via Apple from login page (no pre-filled code)
- **WHEN** a new user completes Apple OAuth from the login page (no invite code in state)
- **THEN** the system SHALL redirect to `/signup/verify-invite` with no pre-filled code
- **AND** the user SHALL be prompted to enter their invite code manually

#### Scenario: New user via Apple with invalid invite code
- **WHEN** the auto-submitted invite code is invalid or already used
- **THEN** the verify-invite page SHALL display an error message
- **AND** the invite code input SHALL remain editable so the user can correct it

#### Scenario: New user via Apple with no invite code
- **WHEN** a new user completes Apple OAuth and does not provide a valid invite code
- **THEN** the user SHALL be signed out
- **AND** SHALL NOT have access to the app

#### Scenario: Returning user skips invite code
- **WHEN** a user who has previously completed signup logs in via Apple
- **THEN** the invite code screen SHALL NOT be shown
- **AND** the user SHALL be authenticated directly
