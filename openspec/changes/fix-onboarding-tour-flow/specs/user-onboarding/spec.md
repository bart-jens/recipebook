## MODIFIED Requirements

### Requirement: Completing onboarding (web)
The system SHALL save the user's display name, username, and optional avatar, set `onboarded_at` to the current timestamp, and redirect to `/onboarding/get-the-app` (not `/recipes`). Validation rules remain unchanged.

#### Scenario: Completing onboarding
- **WHEN** a user fills in display name and username and submits
- **THEN** the profile is updated with the provided values
- **AND** `onboarded_at` is set to the current timestamp
- **AND** the user is redirected to `/onboarding/get-the-app`

#### Scenario: Avatar upload during onboarding
- **WHEN** a user taps the avatar area and selects a photo
- **THEN** the photo is uploaded to the `avatars` storage bucket
- **AND** `avatar_url` is updated on the profile

#### Scenario: Skipping avatar
- **WHEN** a user submits onboarding without uploading an avatar
- **THEN** the profile is saved with `avatar_url` unchanged (NULL or existing)

### Requirement: Web signup routes directly to onboarding
After account creation, the web signup action SHALL redirect the user directly to `/onboarding`. The previous behavior of redirecting to `/recipes` (which then bounced through the authenticated layout guard) is replaced with a direct, explicit redirect.

#### Scenario: New user redirected to onboarding after signup
- **WHEN** a new user completes the web signup form
- **THEN** they are redirected directly to `/onboarding`
- **AND** they see the profile setup form

## ADDED Requirements

### Requirement: Mobile feature tour on first launch
The mobile app SHALL show the feature tour to every user on their first launch on a given device, regardless of whether they completed onboarding on web or mobile. The `(tabs)/_layout.tsx` SHALL check `isTourSeen()` (AsyncStorage) independently of `onboarded_at`. If the tour has not been seen on this device, the user SHALL be redirected to `/tour` before the tabs are shown. The tour check SHALL only run after the onboarding check passes (i.e., user is confirmed onboarded).

#### Scenario: Web-signup user opens mobile app for the first time
- **WHEN** a user who completed onboarding on web opens the mobile app and logs in
- **AND** the tour has not been seen on this device
- **THEN** they are shown the feature tour before the main tabs
- **AND** after completing the tour they are taken to the home tab

#### Scenario: Tour already seen on this device
- **WHEN** a user opens the mobile app
- **AND** the tour has already been seen on this device
- **THEN** they are taken directly to the home tab (no tour)

#### Scenario: Mobile-onboarded user also sees tour
- **WHEN** a user who completed onboarding on mobile (Apple Sign-In flow) enters the tabs
- **AND** the tour has not been seen on this device
- **THEN** they are shown the feature tour
- **AND** after completing the tour they are taken to the home tab

### Requirement: Mobile onboarding no longer directly triggers tour
The mobile onboarding screen (`/onboarding`) SHALL navigate to `/(tabs)` after saving the profile. It SHALL NOT call `isTourSeen()` or navigate to `/tour` directly. The tour redirect is handled exclusively by the tabs layout.

#### Scenario: Mobile onboarding completion
- **WHEN** a user completes the mobile onboarding screen
- **THEN** they are navigated to `/(tabs)`
- **AND** the tabs layout's tour check redirects them to `/tour` if the tour has not been seen
