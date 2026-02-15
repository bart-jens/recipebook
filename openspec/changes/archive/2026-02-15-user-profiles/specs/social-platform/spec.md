# Social Platform — Delta Spec (user-profiles change)

Updates to the social platform spec to support profile privacy controls and follow request approval.

---

## MODIFIED Requirements

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

### Requirement: Updated Row Level Security
RLS policies SHALL be updated for the social model with privacy support:
- Private recipes: only owner can read/write (unchanged)
- Public recipes: anyone can read, only owner can write
- Subscribers-only recipes: owner + subscribers of the creator can read, only owner can write
- User profiles (public): anyone can read, only owner can write
- User profiles (private): display_name, avatar_url, bio, and follower/following counts visible to all; recipes and activity visible only to owner + approved followers
- Follows: anyone can read, follower can insert/delete their own (insert restricted to public targets or via approval flow for private targets)
- Follow requests: only requester and target can read; requester can insert and delete their own; target can delete (approve/deny)
- Ratings on public recipes: anyone can read, author of rating can insert/delete their own

#### Scenario: Reading a public profile
- **WHEN** any authenticated user queries a public user's profile
- **THEN** the full profile SHALL be returned

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

#### Scenario: Cannot edit someone else's public recipe
- **WHEN** user A tries to update user B's public recipe
- **THEN** the update SHALL be rejected by RLS

## ADDED Requirements

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
