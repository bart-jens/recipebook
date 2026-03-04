## ADDED Requirements

### Requirement: Import usage banner on web import pages
The web URL import and photo import pages SHALL display the current user's import usage when the user is on the free plan. The banner SHALL show "X of 10 imports used this month." when imports remain, and "10 of 10 imports used this month — upgrade for unlimited imports." when the limit is reached. The count SHALL be fetched once when the import page mounts. Premium users SHALL see no usage indicator.

#### Scenario: Free user with remaining imports sees count
- **WHEN** a free user opens a web import page with 4 imports used
- **THEN** the page displays "4 of 10 imports used this month."

#### Scenario: Free user at limit sees upgrade message
- **WHEN** a free user opens a web import page with 10 imports used
- **THEN** the page displays "10 of 10 imports used this month — upgrade for unlimited imports."

#### Scenario: Premium user sees no banner
- **WHEN** a premium user opens a web import page
- **THEN** no import usage banner is displayed

#### Scenario: Usage fetch fails gracefully
- **WHEN** the usage fetch fails on page mount
- **THEN** no banner is shown and the import form remains functional

### Requirement: HTTP 429 upgrade prompt on web
When a web import API call returns HTTP 429, the web import page SHALL display an inline upgrade prompt instead of a generic error. The prompt SHALL say "You've reached your monthly import limit." with an "Upgrade to premium" link (or button). The form SHALL remain visible but the import action SHALL be disabled until the user navigates away.

#### Scenario: API returns 429 on URL import
- **WHEN** a free user at their import limit attempts a URL import
- **THEN** the API returns 429
- **AND** the web page shows "You've reached your monthly import limit." with an upgrade CTA

#### Scenario: API returns 429 on photo import
- **WHEN** a free user at their import limit attempts a photo import
- **THEN** the API returns 429
- **AND** the web page shows the upgrade prompt

#### Scenario: Non-429 errors still show generic message
- **WHEN** an import API call fails with a non-429 status code
- **THEN** the web page shows a generic error message (unchanged behavior)
