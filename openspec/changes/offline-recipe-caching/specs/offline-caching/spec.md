## ADDED Requirements

### Requirement: Persistent query cache
The mobile app SHALL persist the TanStack Query cache to AsyncStorage on every cache mutation. On app startup, the persisted cache SHALL be restored before the first render, so screens can display cached data without waiting for a network response. The cache SHALL expire after 7 days.

#### Scenario: App opens with cached data while offline
- **WHEN** the user opens the app in airplane mode
- **AND** recipes were previously loaded while online
- **THEN** the recipes list SHALL display the cached data immediately
- **AND** no loading spinner SHALL be shown

#### Scenario: Cache restored on app restart
- **WHEN** the user force-quits the app and reopens it
- **AND** the cache is less than 7 days old
- **THEN** the recipes list SHALL display cached recipes without a network request

#### Scenario: Cache expires after 7 days
- **WHEN** the cached data is more than 7 days old
- **THEN** the cache SHALL be cleared on startup
- **AND** the app SHALL fetch fresh data from the network

### Requirement: Free tier cache limit — 20 recipes
For free-plan users, the offline cache SHALL contain at most 20 recipe detail entries (the 20 most recently accessed recipes). After each successful recipes list sync, cache entries for recipes beyond the 20 most recent SHALL be pruned from AsyncStorage.

#### Scenario: Free user cache is pruned to 20
- **WHEN** a free user has accessed 25 recipe detail pages
- **AND** the recipes list successfully syncs
- **THEN** only the 20 most recently accessed recipe detail cache entries SHALL remain in storage

#### Scenario: Premium user has no cache limit
- **WHEN** a premium user has accessed 100 recipe detail pages
- **THEN** all 100 recipe detail cache entries SHALL remain in storage

### Requirement: Offline indicator
When the device has no internet connection, affected screens SHALL display a banner indicating that cached data is being shown. The banner SHALL only appear when cached data exists (not when the screen would show an error state).

#### Scenario: Offline banner shown when network is unavailable
- **WHEN** the device has no internet connection
- **AND** cached recipe data exists
- **THEN** a banner reading "No internet — showing cached recipes" SHALL be displayed
- **AND** the cached recipes SHALL be visible below the banner

#### Scenario: No offline banner when network is available
- **WHEN** the device has an active internet connection
- **THEN** no offline banner SHALL be shown

#### Scenario: Error state shown when offline with no cache
- **WHEN** the device has no internet connection
- **AND** no cached data exists for the screen
- **THEN** the standard error state SHALL be shown with a retry button

### Requirement: Online-only operations show feedback when offline
When a user attempts a write operation (save recipe, rate, favorite) while offline, the app SHALL show an informational message explaining that the action cannot be completed without a connection. The action SHALL NOT be queued silently.

#### Scenario: Write attempt while offline
- **WHEN** a user taps "Save Recipe" while in airplane mode
- **THEN** a message SHALL be shown: "You're offline — please reconnect to save changes"
- **AND** the action SHALL not be submitted
