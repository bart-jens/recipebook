# User Profiles

User profiles establish identity, enable attribution, and provide privacy controls in the social recipe platform. Each user has a profile with display name, avatar, bio, and privacy settings. Profiles can be public (default) or private (Instagram-style, requiring follow approval).

---

## Requirements

### Requirement: Profile editing
The system SHALL allow authenticated users to edit their own profile. Editable fields: display_name (required, non-empty), username (unique, 3-30 chars, lowercase alphanumeric + underscores), avatar_url, bio (max 300 characters), and is_private (boolean). Changes SHALL update the `updated_at` timestamp.

#### Scenario: Updating display name
- **WHEN** user updates their display_name to "Maria's Kitchen"
- **THEN** the profile SHALL be updated with the new display_name
- **AND** `updated_at` SHALL be refreshed

#### Scenario: Updating username
- **WHEN** user updates their username to "maria_kitchen"
- **THEN** the profile SHALL be updated with the new username
- **AND** `updated_at` SHALL be refreshed

#### Scenario: Username uniqueness on edit
- **WHEN** user tries to update their username to one that already exists
- **THEN** the update SHALL be rejected with a validation error

#### Scenario: Empty display name rejected
- **WHEN** user submits an empty display_name
- **THEN** the update SHALL be rejected with a validation error

#### Scenario: Bio length limit
- **WHEN** user submits a bio longer than 300 characters
- **THEN** the update SHALL be rejected with a validation error

### Requirement: Privacy toggle
The system SHALL allow users to set their profile to public or private via an `is_private` boolean. Default: `false` (public). When a user switches from public to private, existing followers SHALL be preserved. When a user switches from private to public, all pending follow requests SHALL be automatically approved.

#### Scenario: Setting profile to private
- **WHEN** user A sets is_private to true
- **THEN** user A's recipes and activity SHALL only be visible to approved followers
- **AND** existing followers SHALL remain as followers

#### Scenario: Switching from private to public
- **WHEN** user A sets is_private to false (was previously true)
- **THEN** all pending follow requests for user A SHALL be automatically approved (moved to user_follows)
- **AND** user A's recipes and activity SHALL become visible to all users

#### Scenario: New user default
- **WHEN** a new user signs up
- **THEN** their profile SHALL have is_private = false (public by default)

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

### Requirement: Avatar upload
The system SHALL allow users to upload a profile picture. Avatars SHALL be stored in Supabase Storage bucket `avatars` at path `{userId}/{timestamp}.{ext}`. The client SHALL crop images to square (1:1) and resize to max 512x512 before upload. After upload, the `user_profiles.avatar_url` SHALL be updated with the public storage URL.

#### Scenario: Uploading avatar on web
- **WHEN** user selects an image file on the profile edit page
- **THEN** a crop interface SHALL be shown (1:1 aspect ratio)
- **AND** after confirming, the cropped image SHALL be uploaded to storage
- **AND** avatar_url SHALL be updated on the profile

#### Scenario: Uploading avatar on mobile
- **WHEN** user taps "Change Photo" on the profile tab
- **THEN** the system SHALL offer camera or photo library as source
- **AND** the selected image SHALL be cropped to square, resized to 512x512, and uploaded

#### Scenario: Default avatar
- **WHEN** a user has no avatar_url set (null)
- **THEN** the UI SHALL display a generated avatar (initials on a colored background)

### Requirement: Follow request approval
The system SHALL provide a UI for private profile users to manage incoming follow requests. The UI SHALL show a list of pending requests with requester display name and avatar. Users can approve or deny each request individually.

#### Scenario: Viewing pending requests
- **WHEN** private user B opens the follow requests screen
- **THEN** all pending follow_requests targeting user B SHALL be displayed
- **AND** each entry SHALL show the requester's display_name and avatar

#### Scenario: Approving a follow request
- **WHEN** user B approves a follow request from user A
- **THEN** a row SHALL be inserted into `user_follows` (follower_id=A, following_id=B)
- **AND** the follow_request row SHALL be deleted
- **AND** user A SHALL now see user B's recipes and activity

#### Scenario: Denying a follow request
- **WHEN** user B denies a follow request from user A
- **THEN** the follow_request row SHALL be deleted
- **AND** no row SHALL be inserted into `user_follows`
- **AND** user A SHALL NOT be notified of the denial

#### Scenario: Request count badge
- **WHEN** private user B has 3 pending follow requests
- **THEN** the profile tab/screen SHALL show a badge with the count "3"

### Requirement: Follow and request-to-follow actions
The system SHALL show a follow action button on profile pages. The button behavior SHALL depend on the target user's privacy setting and current relationship.

#### Scenario: Following a public user
- **WHEN** user A taps "Follow" on public user B's profile
- **THEN** a row SHALL be inserted into `user_follows` immediately
- **AND** the button SHALL change to "Following"

#### Scenario: Requesting to follow a private user
- **WHEN** user A taps "Request to Follow" on private user B's profile
- **THEN** a row SHALL be inserted into `follow_requests` (requester_id=A, target_id=B)
- **AND** the button SHALL change to "Requested"

#### Scenario: Cancelling a follow request
- **WHEN** user A taps "Requested" on private user B's profile
- **THEN** the follow_request row SHALL be deleted
- **AND** the button SHALL revert to "Request to Follow"

#### Scenario: Unfollowing a user
- **WHEN** user A taps "Following" on user B's profile
- **THEN** the `user_follows` row SHALL be deleted
- **AND** the button SHALL revert to "Follow" or "Request to Follow" depending on B's privacy setting

### Requirement: Profile stats
The profile page SHALL display stats calculated on demand: recipes (count of user's total recipes), times cooked (count of user's cook_log entries), followers (count of user_follows where following_id = user), following (count of user_follows where follower_id = user).

#### Scenario: Stats on a public profile
- **GIVEN** user B has 5 recipes total, 12 cook_log entries, 8 followers, and follows 3 users
- **THEN** user B's profile SHALL display: "5 recipes", "12 cooked", "8 followers", "3 following"

#### Scenario: Stats on a private profile viewed by non-follower
- **WHEN** non-follower views private user B's profile
- **THEN** followers and following counts SHALL still be visible
- **AND** recipes count and times cooked SHALL be hidden
