## REMOVED Requirements

### Requirement: Fork action on public recipes
**Reason**: Fork functionality is being removed from the platform. Saves, cook logs, and future comments cover the same user needs without the complexity of deep-copying recipes.
**Migration**: Remove fork button from recipe detail page on both web and mobile. Remove `fork_recipe()` RPC function. The `forked_from_id` column and `source_type = 'fork'` enum value remain in the schema but are no longer used by application code.

### Requirement: Fork attribution display
**Reason**: Fork functionality is being removed. No new forks will be created, so attribution display is unnecessary.
**Migration**: Remove fork attribution UI ("Forked from X by Y") from recipe detail page on both web and mobile. Existing recipes with `forked_from_id` set retain the data but it is not displayed.

### Requirement: Fork count on recipe cards
**Reason**: Fork functionality is being removed. Fork count is no longer a meaningful metric.
**Migration**: Remove fork count display from recipe cards and discover page. Remove fork count queries from discover page data fetching.

### Requirement: Fork analytics logging
**Reason**: Fork functionality is being removed. No fork events will be generated.
**Migration**: The `recipe_analytics` table retains existing fork event rows for historical data. No new fork analytics are inserted.

### Requirement: Source type extension for forks
**Reason**: Fork functionality is being removed. The `source_type = 'fork'` value remains valid in the CHECK constraint for existing data but is no longer set by any application code.
**Migration**: No schema change needed. The enum value stays for backwards compatibility with existing rows.
