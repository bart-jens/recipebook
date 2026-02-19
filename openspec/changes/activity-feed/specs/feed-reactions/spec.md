# Feed Reactions

Lightweight social acknowledgment on activity feed items. Users can react to feed events with a single "looks good" reaction, providing a low-friction way to engage with friends' cooking activity.

---

## ADDED Requirements

### Requirement: Feed reactions table
The database SHALL have a `feed_reactions` table with columns: id (uuid), user_id (uuid, references auth.users), event_type (text), source_id (uuid, the primary key of the source row), created_at (timestamptz). A unique constraint SHALL exist on (user_id, event_type, source_id) to prevent duplicate reactions.

#### Scenario: User reacts to a cook event
- **WHEN** user A reacts to user B's cook log entry (source_id = cook_log.id, event_type = 'cooked')
- **THEN** a row SHALL be inserted into feed_reactions with user_id = A, event_type = 'cooked', source_id = cook_log.id

#### Scenario: Duplicate reaction prevented
- **WHEN** user A has already reacted to event X
- **AND** user A attempts to react again
- **THEN** the insert SHALL fail due to the unique constraint

### Requirement: Feed reactions RLS
RLS SHALL be enabled on `feed_reactions`. Users SHALL be able to insert reactions for their own user_id. Users SHALL be able to delete their own reactions. Users SHALL be able to read reactions on events from users they follow.

#### Scenario: User inserts own reaction
- **WHEN** user A inserts a reaction with user_id = A
- **THEN** the insert SHALL succeed

#### Scenario: User cannot insert reaction as another user
- **WHEN** user A attempts to insert a reaction with user_id = B
- **THEN** the insert SHALL be denied

#### Scenario: User deletes own reaction
- **WHEN** user A deletes their reaction
- **THEN** the delete SHALL succeed

### Requirement: Reaction toggle behavior
Tapping the reaction button SHALL toggle the reaction on/off. If the user has not reacted, tapping SHALL create a reaction. If the user has already reacted, tapping SHALL remove the reaction.

#### Scenario: Add reaction
- **WHEN** user taps reaction button on an unreacted feed item
- **THEN** a reaction SHALL be created
- **AND** the reaction count SHALL increment by 1

#### Scenario: Remove reaction
- **WHEN** user taps reaction button on a feed item they already reacted to
- **THEN** the reaction SHALL be deleted
- **AND** the reaction count SHALL decrement by 1

### Requirement: Reaction count in feed
The `get_activity_feed` RPC SHALL return a `reaction_count` (integer) and `user_reacted` (boolean) for each feed item. The count SHALL reflect total reactions from all users. The boolean SHALL indicate whether the current user has reacted.

#### Scenario: Feed item with reactions
- **GIVEN** feed item X has 3 reactions, including one from user A
- **WHEN** user A loads the feed
- **THEN** item X SHALL show reaction_count = 3 and user_reacted = true

#### Scenario: Feed item without reactions
- **GIVEN** feed item Y has 0 reactions
- **WHEN** user A loads the feed
- **THEN** item Y SHALL show reaction_count = 0 and user_reacted = false

### Requirement: Reaction UI (web)
Each feed card SHALL display a small reaction button (fire icon or thumbs-up). The button SHALL show the reaction count when > 0. The button SHALL be visually highlighted when the current user has reacted. Clicking SHALL toggle optimistically with server sync.

#### Scenario: Reaction button display
- **WHEN** a feed item has 2 reactions and the user has reacted
- **THEN** the button SHALL show highlighted state with "2" count

### Requirement: Reaction UI (mobile)
Each feed card SHALL display a reaction button. Tapping SHALL trigger haptic feedback (light impact). The button SHALL show highlighted state and count identical to web. Optimistic update SHALL be used.

#### Scenario: Haptic on react
- **WHEN** user taps reaction button on mobile
- **THEN** light haptic feedback SHALL be triggered
