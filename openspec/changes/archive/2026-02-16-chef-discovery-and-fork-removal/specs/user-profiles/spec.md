## MODIFIED Requirements

### Requirement: Public profile page
The system SHALL provide a public profile page at `/profile/[userId]` displaying: display_name, avatar, bio, and stats (recipes count, times cooked, followers count, following count). Below the stats and follow button, the page SHALL display content in horizontal tabs: Activity, Favorites, Published, Recommendations. For public profiles, tab content SHALL be visible to all authenticated users. For private profiles, tab content SHALL only be visible to approved followers and the profile owner.

#### Scenario: Viewing a public profile
- **WHEN** any authenticated user visits `/profile/[userId]` for a public user
- **THEN** the page SHALL display display_name, avatar, bio, stats, follow button, and tabbed content sections

#### Scenario: Viewing a private profile as non-follower
- **WHEN** user A (not a follower) visits `/profile/[userId]` for a private user B
- **THEN** the page SHALL display display_name, avatar, bio, and follower/following counts
- **AND** tabs SHALL NOT be displayed
- **AND** a "This account is private" message SHALL be shown
- **AND** a "Request to Follow" button SHALL be shown

#### Scenario: Viewing a private profile as approved follower
- **WHEN** user A (an approved follower) visits `/profile/[userId]` for private user B
- **THEN** the page SHALL display the full profile including all tabs (same as public)

#### Scenario: Viewing own profile
- **WHEN** a user visits their own profile page
- **THEN** the page SHALL display the full profile with all tabs and an "Edit Profile" button

### Requirement: Profile stats
The profile page SHALL display stats calculated on demand: recipes (count of user's total recipes), times cooked (count of user's cook_log entries), followers (count of user_follows where following_id = user), following (count of user_follows where follower_id = user).

#### Scenario: Stats on a public profile
- **GIVEN** user B has 5 recipes total, 12 cook_log entries, 8 followers, and follows 3 users
- **THEN** user B's profile SHALL display: "5 recipes", "12 cooked", "8 followers", "3 following"

#### Scenario: Stats on a private profile viewed by non-follower
- **WHEN** non-follower views private user B's profile
- **THEN** followers and following counts SHALL still be visible
- **AND** recipes count and times cooked SHALL be hidden
