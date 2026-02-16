# Social Platform

EefEats evolves from a personal recipe book into a Goodreads-for-recipes social platform. Users can discover, rate, and fork public recipes. Social connections let you follow friends and see their cooking activity.

## Core Concepts

### Canonical Recipes
A canonical recipe is the public, authoritative version. It accumulates ratings from all users. It has a creator (the person who published it). It cannot be edited by anyone other than the creator.

### Forked Recipes (Personal Copies)
When a user wants to modify a canonical recipe, they fork it. A fork is a private copy linked to the original via `forked_from_id`. Forks are only visible to the owner. The link to the original is preserved for attribution.

### Existing Personal Recipes
Current recipes in the system are personal (private). When the social layer launches, existing recipes remain private by default. Users can choose to "publish" a personal recipe, which creates a canonical version.

---

## ADDED Requirements

### Requirement: User profiles table
The database SHALL have a `user_profiles` table with columns: `id` (uuid, PK, FK to auth.users), `display_name` (text, NOT NULL), `avatar_url` (text), `bio` (text), `role` (text, default 'user', CHECK in: user, creator, admin), `plan` (text, default 'free', CHECK in: free, premium), `is_private` (boolean, NOT NULL, default false), `created_at` (timestamptz), `updated_at` (timestamptz).

#### Scenario: Profile created on signup
- **WHEN** a new user signs up
- **THEN** a `user_profiles` row SHALL be created with their email-derived display name, role 'user', and is_private = false

#### Scenario: Profile update
- **WHEN** a user updates their display name to "Chef Maria"
- **THEN** the `display_name` SHALL be updated and `updated_at` refreshed

#### Scenario: Setting profile to private
- **WHEN** a user sets is_private to true
- **THEN** the `is_private` column SHALL be updated and `updated_at` refreshed

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

### Requirement: Follows table
The database SHALL have a `user_follows` table with columns: `id` (uuid, PK), `follower_id` (uuid, FK to auth.users), `following_id` (uuid, FK to auth.users), `created_at` (timestamptz). There SHALL be a unique constraint on (follower_id, following_id). A CHECK constraint SHALL prevent self-follows. For public profiles, follows are inserted directly. For private profiles, follows SHALL only be created through the follow request approval flow.

#### Scenario: Following a public user
- **WHEN** user A follows public user B
- **THEN** a row SHALL be created with follower_id = A, following_id = B

#### Scenario: Following a private user requires approval
- **WHEN** user A attempts to follow private user B
- **THEN** the system SHALL NOT insert into `user_follows` directly
- **AND** instead SHALL insert a row into `follow_requests`

#### Scenario: Preventing duplicate follows
- **WHEN** user A follows user B twice
- **THEN** the second insert SHALL be rejected by the unique constraint

#### Scenario: Self-follow prevention
- **WHEN** user A tries to follow themselves
- **THEN** the insert SHALL be rejected by the CHECK constraint

### Requirement: Follow requests table
The database SHALL have a `follow_requests` table with columns: `id` (uuid, PK, default gen_random_uuid()), `requester_id` (uuid, NOT NULL, FK to auth.users on delete cascade), `target_id` (uuid, NOT NULL, FK to auth.users on delete cascade), `created_at` (timestamptz, NOT NULL, default now()). There SHALL be a unique constraint on (requester_id, target_id). A CHECK constraint SHALL prevent self-requests.

#### Scenario: Creating a follow request
- **WHEN** user A requests to follow private user B
- **THEN** a row SHALL be created with requester_id = A, target_id = B

#### Scenario: Preventing duplicate requests
- **WHEN** user A requests to follow user B twice
- **THEN** the second insert SHALL be rejected by the unique constraint

#### Scenario: Self-request prevention
- **WHEN** user A tries to request to follow themselves
- **THEN** the insert SHALL be rejected by the CHECK constraint

#### Scenario: Approving a follow request
- **WHEN** user B approves user A's follow request
- **THEN** a row SHALL be inserted into `user_follows` (follower_id=A, following_id=B)
- **AND** the follow_request row SHALL be deleted

#### Scenario: Denying a follow request
- **WHEN** user B denies user A's follow request
- **THEN** the follow_request row SHALL be deleted
- **AND** no row SHALL be inserted into `user_follows`

#### Scenario: Cancelling a follow request
- **WHEN** user A cancels their own pending request to follow user B
- **THEN** the follow_request row SHALL be deleted

### Requirement: Public ratings on canonical recipes
The existing `recipe_ratings` table SHALL work for both personal and canonical recipes. When a recipe is public, all ratings from all users are visible. The recipe card and detail page SHALL show the aggregate average and count.

#### Scenario: Aggregate rating display
- **GIVEN** recipe X has ratings of 4, 5, 3 from three users
- **THEN** the displayed average SHALL be 4.0 with count "3 ratings"

#### Scenario: Rating a public recipe
- **WHEN** user A rates public recipe X with 4 stars and a note
- **THEN** the rating SHALL be visible to all users viewing recipe X

### Requirement: Activity feed
The system SHALL provide an activity feed showing recent actions by users you follow. Activities include: published a recipe, cooked a recipe (added a rating), forked a recipe. The feed SHALL be ordered by recency and paginated.

#### Scenario: Feed shows followed user's activity
- **WHEN** user A follows user B, and user B publishes a recipe
- **THEN** user A's feed SHALL show "B published [recipe title]"

#### Scenario: Feed excludes unfollowed users
- **WHEN** user A does not follow user C
- **THEN** user C's activity SHALL NOT appear in user A's feed

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

### Requirement: Updated Row Level Security
RLS policies SHALL be updated for recipe visibility:
- Private recipes: only owner can read/write (unchanged)
- Public recipes: any authenticated user can read, only owner can write
- Subscribers-only recipes: owner + subscribers of the creator can read, only owner can write
- User profiles (public): anyone can read, only owner can write
- User profiles (private): display_name, avatar_url, bio, and follower/following counts visible to all; recipes and activity visible only to owner + approved followers
- Follows: anyone can read, follower can insert/delete their own (insert restricted to public targets or via approval flow for private targets)
- Follow requests: only requester and target can read; requester can insert and delete their own; target can delete (approve/deny)
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

#### Scenario: Reading a private profile as non-follower
- **WHEN** a non-follower queries a private user's profile
- **THEN** the profile row SHALL be returned (display_name, avatar_url, bio, is_private are visible)
- **AND** the user's recipes SHALL NOT be returned by recipe queries

#### Scenario: Reading a private profile as approved follower
- **WHEN** an approved follower queries a private user's profile
- **THEN** the full profile SHALL be returned
- **AND** the user's recipes SHALL be returned by recipe queries

#### Scenario: Inserting a follow for a public user
- **WHEN** user A inserts into user_follows for public user B
- **THEN** the insert SHALL succeed

#### Scenario: Inserting a follow for a private user blocked
- **WHEN** user A inserts directly into user_follows for private user B (without approval)
- **THEN** the insert SHALL be rejected by RLS

---

## Migration Strategy

### Phase 1: Data model (no behavior change)
Add new columns and tables. All existing recipes stay `visibility = 'private'`. No public content yet. Existing app continues to work unchanged.

### Phase 2: Profiles + publishing
Users can create profiles and publish recipes. Public recipes appear in a discovery page. No follows or feed yet.

### Phase 3: Social
Follows, activity feed, forking. Full social loop.

---

## Free vs Premium Considerations

| Feature | Free | Premium |
|---|---|---|
| Personal recipes | Unlimited | Unlimited |
| Publish public recipes | Up to 10 | Unlimited |
| Fork public recipes | Unlimited | Unlimited |
| Follow users | Unlimited | Unlimited |
| View subscribers-only recipes | No | Yes (per creator subscription) |
| Cooking log | Yes | Yes |
| Meal planning | No | Yes (future) |
| Nutritional info | No | Yes (future) |
| Advanced search filters | Basic | Full |
