## ADDED Requirements

### Requirement: Monthly import counter on user profile
The system SHALL track the number of recipe imports used in the current calendar month per user. `user_profiles` SHALL have two new columns: `monthly_imports_used` (integer, default 0) and `imports_reset_at` (timestamptz, nullable). The counter covers all three import types: URL, Instagram, and Photo OCR. Manual recipe entry SHALL NOT be counted.

#### Scenario: New user has zero imports used
- **WHEN** a new user is created
- **THEN** `monthly_imports_used` SHALL be 0

#### Scenario: Counter increments on successful import
- **WHEN** a free user successfully completes a URL, Instagram, or Photo import
- **THEN** `monthly_imports_used` SHALL increase by 1

#### Scenario: Manual recipe entry does not count
- **WHEN** a user creates a recipe via the manual entry form
- **THEN** `monthly_imports_used` SHALL NOT change

### Requirement: Import gate at API level
Each extract API route (`/api/extract-url`, `/api/extract-instagram`, `/api/extract-photo`) SHALL check the current user's import allowance before processing. Free users SHALL be limited to 10 imports per calendar month. Premium users SHALL bypass the check and have unlimited imports. The check SHALL be performed via an atomic Supabase RPC `check_and_increment_import_count()` that performs lazy monthly reset, enforces the limit, and increments the counter in a single transaction.

#### Scenario: Free user within limit
- **WHEN** a free user with `monthly_imports_used = 7` calls any extract route
- **THEN** the import SHALL proceed normally
- **AND** `monthly_imports_used` SHALL become 8

#### Scenario: Free user at limit
- **WHEN** a free user with `monthly_imports_used = 10` calls any extract route
- **THEN** the API SHALL return HTTP 429
- **AND** the response SHALL include `{ "error": "import_limit_reached", "used": 10, "limit": 10 }`
- **AND** `monthly_imports_used` SHALL NOT be incremented

#### Scenario: Premium user bypasses limit
- **WHEN** a user with `plan = 'premium'` calls any extract route regardless of `monthly_imports_used`
- **THEN** the import SHALL proceed normally with no counter check

#### Scenario: Unauthenticated request is still rejected with 401
- **WHEN** an unauthenticated request is made to any extract route
- **THEN** the API SHALL return HTTP 401 (unchanged behavior)

### Requirement: Lazy monthly reset
The import counter SHALL reset automatically at the start of each new calendar month without requiring a scheduled job. The RPC SHALL compare `imports_reset_at` to the current month. If `imports_reset_at` is null or falls in a prior calendar month, the RPC SHALL reset `monthly_imports_used = 0` and set `imports_reset_at = now()` before applying the limit check.

#### Scenario: First import of a new month
- **WHEN** a free user's `imports_reset_at` is in a prior calendar month and they attempt an import
- **THEN** the counter SHALL be reset to 0 before the check
- **AND** the import SHALL proceed (count goes from 0 to 1)
- **AND** `imports_reset_at` SHALL be updated to now

#### Scenario: First-ever import (null reset timestamp)
- **WHEN** a user's `imports_reset_at` is null and they attempt an import
- **THEN** the counter SHALL be treated as 0 and the import SHALL proceed
- **AND** `imports_reset_at` SHALL be set to now

### Requirement: Import usage visible in UI
Both web and mobile import entry points SHALL display the user's current import usage. Free users SHALL see "X of 10 imports used this month." Premium users SHALL see no usage indicator. The count SHALL be fetched when the import screen is opened, not on every page load.

#### Scenario: Free user with remaining imports sees count
- **WHEN** a free user opens any import screen with `monthly_imports_used = 4`
- **THEN** the screen SHALL display "4 of 10 imports used this month"

#### Scenario: Free user at limit sees blocked state
- **WHEN** a free user opens any import screen with `monthly_imports_used = 10`
- **THEN** the import action SHALL be disabled
- **AND** a message SHALL be shown: "You've used all 10 imports for this month"
- **AND** an upgrade prompt SHALL be shown (without a functioning paywall for now — "Upgrade to Premium" as a visible but unlinked/placeholder CTA)

#### Scenario: Premium user sees no usage indicator
- **WHEN** a premium user opens any import screen
- **THEN** no usage count SHALL be displayed

### Requirement: Import limit error state in UI
When an import request returns HTTP 429, both web and mobile SHALL display a clear, non-confusing error state. The UI SHALL NOT show a generic "something went wrong" message.

#### Scenario: Web import blocked mid-flow
- **WHEN** a free user submits an import form and the API returns 429
- **THEN** the web UI SHALL display "Monthly import limit reached. Upgrade to Premium for unlimited imports."
- **AND** the import form SHALL remain visible (user can copy the URL/content)

#### Scenario: Mobile import blocked mid-flow
- **WHEN** a free user submits a mobile import and the API returns 429
- **THEN** the mobile UI SHALL display the same limit-reached message
- **AND** the import screen SHALL NOT crash or show a generic error
