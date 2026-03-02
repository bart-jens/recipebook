## MODIFIED Requirements

### Requirement: URL import flow
The system SHALL allow authenticated users to import a recipe from a URL via `/api/extract-url`. The route SHALL first check the user's monthly import allowance via `check_and_increment_import_count()`. If the user is at or over their plan limit, the route SHALL return HTTP 429 with `{ "error": "import_limit_reached", "used": <n>, "limit": <n> }`. If within limit, the route SHALL proceed with URL parsing, increment the counter atomically, and return the extracted recipe. The user SHALL review the extracted data before saving. Free users are limited to 10 imports/month; premium users are unlimited.

#### Scenario: Successful URL import within limit
- **WHEN** an authenticated free user with fewer than 10 imports this month POSTs a valid URL
- **THEN** the route SHALL return the extracted recipe JSON
- **AND** the monthly import counter SHALL be incremented by 1

#### Scenario: URL import blocked at limit
- **WHEN** an authenticated free user with 10 imports this month POSTs a URL
- **THEN** the route SHALL return HTTP 429
- **AND** the response body SHALL include `{ "error": "import_limit_reached", "used": 10, "limit": 10 }`

#### Scenario: URL is missing from request
- **WHEN** a POST is made to `/api/extract-url` without a `url` field
- **THEN** the route SHALL return HTTP 400 (unchanged behavior)

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated request is made to `/api/extract-url`
- **THEN** the route SHALL return HTTP 401 (unchanged behavior)

### Requirement: Instagram import flow
The system SHALL allow authenticated users to import a recipe from an Instagram post URL via `/api/extract-instagram`. The route SHALL first check the user's monthly import allowance via `check_and_increment_import_count()`. If the user is at or over their plan limit, the route SHALL return HTTP 429. If within limit, the route SHALL proceed with Instagram extraction and increment the counter atomically. Free users are limited to 10 imports/month (shared pool with URL and Photo imports); premium users are unlimited.

#### Scenario: Successful Instagram import within limit
- **WHEN** an authenticated free user with fewer than 10 imports this month POSTs a valid Instagram URL
- **THEN** the route SHALL return the extracted recipe JSON
- **AND** the monthly import counter SHALL be incremented by 1

#### Scenario: Instagram import blocked at limit
- **WHEN** an authenticated free user with 10 imports this month POSTs an Instagram URL
- **THEN** the route SHALL return HTTP 429 with `{ "error": "import_limit_reached", "used": 10, "limit": 10 }`

### Requirement: Photo OCR import flow
The system SHALL allow authenticated users to import a recipe from a photo via `/api/extract-photo`. The route SHALL first check the user's monthly import allowance via `check_and_increment_import_count()`. If the user is at or over their plan limit, the route SHALL return HTTP 429. If within limit, the route SHALL call Gemini Vision API and increment the counter atomically. Free users are limited to 10 imports/month (shared pool); premium users are unlimited.

#### Scenario: Successful photo import within limit
- **WHEN** an authenticated free user with fewer than 10 imports this month POSTs a valid image
- **THEN** the route SHALL return the extracted recipe JSON
- **AND** the monthly import counter SHALL be incremented by 1

#### Scenario: Photo import blocked at limit
- **WHEN** an authenticated free user with 10 imports this month POSTs a photo
- **THEN** the route SHALL return HTTP 429 with `{ "error": "import_limit_reached", "used": 10, "limit": 10 }`
