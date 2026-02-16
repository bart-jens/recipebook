## MODIFIED Requirements

### Requirement: Recipe visibility and publishing
The `recipes` table SHALL be extended with: `visibility` (text, NOT NULL, default 'private', CHECK in: private, public, subscribers), `forked_from_id` (uuid, nullable FK to recipes, ON DELETE SET NULL), `published_at` (timestamptz, nullable). **A CHECK constraint SHALL enforce that imported recipes (source_type != 'manual') cannot have visibility other than 'private'.** Imported recipes use the recipe_shares mechanism for social sharing instead.

#### Scenario: Publishing a personal recipe
- **WHEN** a user sets a manual recipe's visibility to 'public'
- **THEN** `published_at` SHALL be set to now() and the recipe SHALL appear in public discovery

#### Scenario: Unpublishing a recipe
- **WHEN** a user sets a public recipe's visibility back to 'private'
- **THEN** `published_at` SHALL be set to null and the recipe SHALL be removed from discovery

#### Scenario: Default visibility
- **WHEN** a new recipe is created
- **THEN** visibility SHALL default to 'private'
- **AND** published_at SHALL be null

#### Scenario: Imported recipe cannot be published
- **WHEN** a user attempts to set visibility to 'public' on a recipe with source_type = 'url'
- **THEN** the update SHALL be rejected by the database CHECK constraint

#### Scenario: Imported recipe cannot be set to subscribers
- **WHEN** a user attempts to set visibility to 'subscribers' on a recipe with source_type = 'instagram'
- **THEN** the update SHALL be rejected by the database CHECK constraint

#### Scenario: Forking a canonical recipe
- **WHEN** user A forks recipe X
- **THEN** a new recipe SHALL be created with `forked_from_id` = X's id, `visibility` = 'private', and all content copied from X

#### Scenario: Fork attribution
- **WHEN** viewing a forked recipe
- **THEN** the UI SHALL show "Forked from [original title] by [creator name]" with a link to the original

#### Scenario: Private fork isolation
- **WHEN** user A forks recipe X and edits it
- **THEN** the changes SHALL NOT affect the original recipe X
- **AND** the fork SHALL NOT be visible to other users

#### Scenario: Original deleted, fork persists
- **WHEN** the original recipe is deleted
- **THEN** the fork's forked_from_id SHALL be set to null (ON DELETE SET NULL)
- **AND** the fork SHALL continue to function as a standalone recipe

### Requirement: Updated Row Level Security
RLS policies SHALL be updated for recipe visibility:
- Private recipes: only owner can read/write (unchanged)
- Public recipes: any authenticated user can read, only owner can write
- Subscribers-only recipes: owner + subscribers of the creator can read, only owner can write
- Ratings on public recipes: any authenticated user can read, author of rating can insert/update/delete their own

#### Scenario: Reading a public recipe
- **WHEN** any authenticated user queries a public recipe
- **THEN** the recipe SHALL be returned regardless of who created it

#### Scenario: Cannot edit someone else's public recipe
- **WHEN** user A tries to update user B's public recipe
- **THEN** the update SHALL be rejected by RLS

#### Scenario: Private recipe remains private
- **WHEN** user A queries recipes
- **THEN** only user A's own private recipes and all public recipes SHALL be returned
- **AND** other users' private recipes SHALL NOT be returned

#### Scenario: Rating a public recipe
- **WHEN** user A inserts a rating for public recipe X
- **THEN** the insert SHALL succeed
- **AND** the rating SHALL be visible to all users

### Requirement: Recipe discovery
The system SHALL provide a public discovery page where users can browse canonical (public) recipes. Discovery SHALL support: search by title (case-insensitive ILIKE), filter by tags, sort by newest (published_at desc), highest rated (avg rating desc), and most popular (rating count desc). Discovery only shows public recipes, never private or subscribers-only.

#### Scenario: Search public recipes
- **WHEN** a user searches for "pasta" in discovery
- **THEN** only public recipes with "pasta" in the title SHALL be returned

#### Scenario: Private recipes excluded
- **WHEN** a user browses discovery
- **THEN** recipes with visibility 'private' SHALL NOT appear

#### Scenario: Subscribers-only recipes excluded from discovery
- **WHEN** a user browses discovery
- **THEN** recipes with visibility 'subscribers' SHALL NOT appear in the discovery page
