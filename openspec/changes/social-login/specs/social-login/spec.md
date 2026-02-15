# Social Login

Google and Apple OAuth login for web and mobile, with invite code enforcement for new signups.

---

## ADDED Requirements

### Requirement: Google OAuth login
The system SHALL support Sign in with Google on both web and mobile. On web, the system SHALL use Supabase's `signInWithOAuth` with redirect. On mobile, the system SHALL use native Google Sign-In and exchange the id_token with Supabase via `signInWithIdToken`.

#### Scenario: Google login on web
- **WHEN** a user clicks "Sign in with Google" on the web login page
- **THEN** the user SHALL be redirected to Google's OAuth consent screen
- **AND** upon approval, SHALL be redirected back to `/auth/callback`
- **AND** SHALL be authenticated and redirected to the main app

#### Scenario: Google login on mobile
- **WHEN** a user taps "Sign in with Google" on the mobile login screen
- **THEN** the native Google Sign-In flow SHALL be presented
- **AND** upon approval, the id_token SHALL be exchanged with Supabase
- **AND** the user SHALL be authenticated

#### Scenario: Google login with existing email account
- **WHEN** a user who signed up with email `bart@example.com` logs in with Google using the same email
- **THEN** the accounts SHALL be linked automatically
- **AND** the user SHALL retain all existing data (recipes, ratings, profile)

### Requirement: Apple OAuth login
The system SHALL support Sign in with Apple on both web and mobile. On iOS, the system SHALL use native Apple Sign-In (`expo-apple-authentication`). On web, the system SHALL use Supabase's `signInWithOAuth` with Apple provider.

#### Scenario: Apple login on iOS
- **WHEN** a user taps "Sign in with Apple" on iOS
- **THEN** the native Apple Sign-In sheet SHALL be presented
- **AND** upon approval, the identity token SHALL be exchanged with Supabase via `signInWithIdToken`
- **AND** the user SHALL be authenticated

#### Scenario: Apple login on web
- **WHEN** a user clicks "Sign in with Apple" on the web login page
- **THEN** the user SHALL be redirected to Apple's OAuth flow
- **AND** upon approval, SHALL be redirected back and authenticated

#### Scenario: Apple provides name only on first authorization
- **WHEN** a user signs in with Apple for the first time
- **THEN** the system SHALL capture the user's full name from Apple's response
- **AND** store it as the profile display_name
- **WHEN** the same user signs in with Apple again
- **THEN** the system SHALL NOT expect Apple to provide the name again

### Requirement: Invite code check for social signups
New users signing up via social login SHALL still be required to provide a valid invite code. The invite code check SHALL happen after OAuth completes but before granting app access.

#### Scenario: New user via Google with valid invite code
- **WHEN** a new user completes Google OAuth (no existing profile)
- **THEN** the system SHALL redirect to an invite code screen
- **AND** when a valid invite code is entered, the user SHALL gain app access
- **AND** the invite code SHALL be marked as used

#### Scenario: New user via Google with no invite code
- **WHEN** a new user completes Google OAuth and does not provide a valid invite code
- **THEN** the user SHALL be signed out
- **AND** SHALL NOT have access to the app

#### Scenario: Returning user skips invite code
- **WHEN** a user who has previously completed signup logs in via Google or Apple
- **THEN** the invite code screen SHALL NOT be shown
- **AND** the user SHALL be authenticated directly

### Requirement: Account linking
The system SHALL automatically link accounts that share the same email address. A user who signed up with email/password and later logs in with Google (same email) SHALL be treated as the same user.

#### Scenario: Linking email and Google accounts
- **WHEN** user with email `chef@example.com` (email signup) logs in with Google using `chef@example.com`
- **THEN** both auth identities SHALL be linked to the same user ID
- **AND** the user's recipes, ratings, and profile SHALL be preserved

#### Scenario: Linking email and Apple accounts
- **WHEN** user with email `chef@example.com` (email signup) logs in with Apple using the same email
- **THEN** both auth identities SHALL be linked to the same user ID

### Requirement: Social login UI
The login and signup screens SHALL show social login buttons above the email/password form, separated by an "or" divider. The Apple button SHALL follow Apple's Human Interface Guidelines (black background, Apple logo). The Google button SHALL follow Google's branding guidelines.

#### Scenario: Login page layout
- **WHEN** a user visits the login page
- **THEN** "Sign in with Google" and "Sign in with Apple" buttons SHALL be displayed above the email/password form
- **AND** an "or" divider SHALL separate social buttons from the email form

#### Scenario: Mobile login screen layout
- **WHEN** a user opens the mobile app login screen
- **THEN** "Sign in with Google" and "Sign in with Apple" buttons SHALL be displayed
- **AND** the layout SHALL match the web login page structure

### Requirement: OAuth profile metadata
The `handle_new_user()` trigger SHALL use OAuth provider metadata to set the user's initial display name and avatar. The priority SHALL be: OAuth full_name > OAuth name > email prefix for display_name. For avatar: OAuth avatar_url > OAuth picture > null.

#### Scenario: Google signup sets display name and avatar
- **WHEN** a new user signs up via Google with name "Maria Santos" and a profile picture
- **THEN** display_name SHALL be set to "Maria Santos"
- **AND** avatar_url SHALL be set to the Google profile picture URL

#### Scenario: Apple signup sets display name
- **WHEN** a new user signs up via Apple with name "John Doe"
- **THEN** display_name SHALL be set to "John Doe"
- **AND** avatar_url SHALL be null (Apple does not provide profile pictures)

#### Scenario: Fallback to email prefix
- **WHEN** a new user signs up via OAuth but no name is provided in metadata
- **THEN** display_name SHALL fall back to the email prefix (e.g., `bart` from `bart@example.com`)
