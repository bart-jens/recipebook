## MODIFIED Requirements

### Requirement: Activity feed visibility filter
The activity feed view SHALL only include events for recipes with `visibility = 'public'`. This applies to all event types. No private recipe references SHALL appear in the feed.

#### Scenario: Activity feed excludes private recipe events
- **WHEN** the activity feed is queried
- **THEN** no events referencing recipes with `visibility != 'public'` are returned
