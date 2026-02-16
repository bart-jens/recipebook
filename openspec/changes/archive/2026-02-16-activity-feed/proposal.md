## Why

The activity feed is what turns EefEats from a personal recipe box into a social platform. It answers "what are my friends cooking?" — the core social question. Without a feed, the follow system has no payoff. The feed builds on the recipe interaction model (cook_log signals) and the social graph (user_follows) that already exist in the database.

## What Changes

- **Activity feed on home screen** — "Friends are cooking" section showing recent activity from followed users. Chronological, not algorithmic.
- **Activity types** — Cooked a recipe (primary signal), published a recipe, forked a recipe.
- **Feed item display** — User avatar + name, action type, recipe card preview, timestamp.
- **Pagination** — Infinite scroll with cursor-based pagination.
- **Empty state** — When following nobody or nobody has activity: prompt to discover and follow users.

## Capabilities

### New Capabilities
- `activity-feed`: Feed data model, query, UI on web and mobile, pagination, empty states.

### Modified Capabilities
- `social-platform`: Activity feed requirement gets full implementation spec (currently just a placeholder requirement).

## Impact

- **Database**: New `activity_feed` materialized view or query joining cook_log + recipes + user_follows. No new tables — feed is derived from existing data (cook_log, recipe visibility changes, forked_from_id inserts).
- **Web app**: Home dashboard gets "Friends cooking" feed section.
- **Mobile app**: Home tab gets activity feed.
- **Performance**: Feed query joins multiple tables. At invite scale this is fine. May need materialization at scale.
