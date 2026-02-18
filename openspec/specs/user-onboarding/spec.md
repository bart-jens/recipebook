# User Onboarding

## Requirements

### Requirement: Onboarding screen
The system SHALL display a single-screen onboarding page after a user's first sign-in (when `onboarded_at` is NULL). The screen SHALL collect: display name (pre-filled from current profile), username (auto-suggested from display name), and avatar (optional upload). On submit, the system SHALL update the user's profile and set `onboarded_at` to the current timestamp.

#### Scenario: New user sees onboarding
- **WHEN** a new user signs in for the first time
- **AND** their `onboarded_at` is NULL
- **THEN** they are redirected to the onboarding screen

#### Scenario: Completing onboarding
- **WHEN** a user fills in display name and username and submits
- **THEN** the profile is updated with the provided values
- **AND** `onboarded_at` is set to the current timestamp
- **AND** the user is redirected to `/recipes`

#### Scenario: Avatar upload during onboarding
- **WHEN** a user taps the avatar area and selects a photo
- **THEN** the photo is uploaded to the `avatars` storage bucket
- **AND** `avatar_url` is updated on the profile

#### Scenario: Skipping avatar
- **WHEN** a user submits onboarding without uploading an avatar
- **THEN** the profile is saved with `avatar_url` unchanged (NULL or existing)

### Requirement: Onboarding gate
The system SHALL redirect authenticated users to `/onboarding` when their `onboarded_at` is NULL. The onboarding page itself SHALL NOT trigger this redirect (to avoid loops). Users who have completed onboarding SHALL be redirected away from `/onboarding` to `/recipes`.

#### Scenario: Un-onboarded user accessing app
- **WHEN** an authenticated user with `onboarded_at = NULL` navigates to any authenticated route
- **THEN** they are redirected to `/onboarding`

#### Scenario: Onboarded user accessing onboarding page
- **WHEN** an authenticated user with `onboarded_at` set navigates to `/onboarding`
- **THEN** they are redirected to `/recipes`

#### Scenario: Unauthenticated user accessing onboarding
- **WHEN** an unauthenticated user navigates to `/onboarding`
- **THEN** they are redirected to `/login`

### Requirement: Username validation
Usernames SHALL be 3-30 characters, lowercase alphanumeric and underscores only (`^[a-z0-9_]{3,30}$`). Usernames SHALL be unique across all users. The system SHALL check uniqueness on blur and on submit, and display an inline error if taken.

#### Scenario: Valid username
- **WHEN** a user enters "bart_cooks"
- **THEN** the username is accepted (if not already taken)

#### Scenario: Invalid username format
- **WHEN** a user enters "Bart Cooks!"
- **THEN** an inline error is shown: invalid format

#### Scenario: Username already taken
- **WHEN** a user enters a username that already exists
- **THEN** an inline error is shown: username is taken

#### Scenario: Username auto-suggestion
- **WHEN** a user types "Bart Hessels" as their display name
- **THEN** the username field auto-suggests "bart_hessels"
- **AND** the user can edit the suggestion

### Requirement: Display name pre-fill
The onboarding screen SHALL pre-fill the display name field with the user's current `display_name` from their profile (set during auto-creation from email prefix or OAuth metadata).

#### Scenario: Display name pre-filled
- **WHEN** a user with auto-created display name "bwhessels" opens onboarding
- **THEN** the display name field shows "bwhessels"
- **AND** the user can change it
