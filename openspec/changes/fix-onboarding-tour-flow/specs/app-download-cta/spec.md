## ADDED Requirements

### Requirement: App download page after web onboarding
After a user completes web onboarding, the system SHALL redirect them to a dedicated "get the app" page at `/onboarding/get-the-app` before proceeding to the main app. The page SHALL display: the EefEats logo, a headline ("You're all set."), a short pitch for the mobile app, an App Store download button, and a "Continue on web" escape link. The page SHALL be accessible only to authenticated users; unauthenticated visitors SHALL be redirected to `/login`.

#### Scenario: User is shown app download page after onboarding
- **WHEN** a user successfully completes web onboarding (display name + username submitted)
- **THEN** they are redirected to `/onboarding/get-the-app`
- **AND** the page shows the headline "You're all set."
- **AND** the page shows an App Store download button
- **AND** the page shows a "Continue on web" link

#### Scenario: App Store button links to correct URL
- **WHEN** `NEXT_PUBLIC_APP_STORE_URL` is set
- **THEN** the App Store button links to that URL
- **WHEN** `NEXT_PUBLIC_APP_STORE_URL` is not set
- **THEN** the App Store button links to `https://apps.apple.com`

#### Scenario: User continues on web
- **WHEN** a user clicks "Continue on web"
- **THEN** they are navigated to `/recipes`

#### Scenario: Unauthenticated access
- **WHEN** an unauthenticated user visits `/onboarding/get-the-app`
- **THEN** they are redirected to `/login`

### Requirement: App download page visual design
The page SHALL use the EefEats design language: cream background (`bg-bg`), dark ink text, Inter Tight font, no emojis. The layout SHALL be centered, full-screen, with generous whitespace. The App Store button SHALL use the official Apple App Store badge SVG (black variant). The "Continue on web" link SHALL be visually subdued (muted ink color, smaller text) to keep the primary CTA prominent.

#### Scenario: Page renders correctly on all screen widths
- **WHEN** the page is viewed on mobile web (375px wide)
- **THEN** all elements are visible and not clipped
- **WHEN** the page is viewed on desktop (1440px wide)
- **THEN** the content is centered and max-width constrained
