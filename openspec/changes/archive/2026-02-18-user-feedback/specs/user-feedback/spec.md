## ADDED Requirements

### Requirement: Feedback database table
The system SHALL store feedback in a `feedback` table with columns: `id` (uuid PK, default gen_random_uuid()), `user_id` (uuid FK to auth.users, NOT NULL), `message` (text, NOT NULL, minimum 1 character after trim), `platform` (text, NOT NULL — 'web' or 'mobile'), `app_version` (text, nullable), `source_screen` (text, nullable), `status` (text, NOT NULL, default 'new' — one of 'new', 'read', 'resolved'), `metadata` (jsonb, default '{}'), `created_at` (timestamptz, default now()).

#### Scenario: Feedback row is created
- **WHEN** a user submits feedback
- **THEN** a row is inserted with user_id set to the authenticated user, message set to the submitted text, platform set to the client platform, and status defaulting to 'new'

#### Scenario: Empty message is rejected
- **WHEN** a user attempts to submit feedback with an empty or whitespace-only message
- **THEN** the insert SHALL fail (enforced via CHECK constraint on message length)

### Requirement: Feedback RLS policies
The system SHALL enable RLS on the `feedback` table with the following policies:
- Authenticated users MAY INSERT rows where `user_id = auth.uid()`
- Users with role 'admin' in `user_profiles` MAY SELECT all rows
- Users with role 'admin' in `user_profiles` MAY UPDATE the `status` column on any row
- No user MAY DELETE feedback rows
- Non-admin users SHALL NOT be able to SELECT feedback (including their own past submissions)

#### Scenario: Regular user inserts feedback
- **WHEN** an authenticated non-admin user inserts a feedback row with their own user_id
- **THEN** the insert succeeds

#### Scenario: Regular user tries to read feedback
- **WHEN** an authenticated non-admin user selects from the feedback table
- **THEN** zero rows are returned

#### Scenario: Admin reads all feedback
- **WHEN** an admin user selects from the feedback table
- **THEN** all feedback rows are returned regardless of user_id

#### Scenario: Admin updates feedback status
- **WHEN** an admin user updates the status of a feedback row to 'read' or 'resolved'
- **THEN** the update succeeds

### Requirement: Feedback submission form on mobile
The system SHALL display a "Send Feedback" button on the mobile profile screen in the actions section (between "Invite Friends" and "Sign out"). Tapping it SHALL open a bottom sheet or modal containing:
- A heading: "Send Feedback"
- A multiline text input with placeholder text encouraging bugs, ideas, or general thoughts
- A "Send" button that submits the feedback
- A close/dismiss control

#### Scenario: User opens feedback form
- **WHEN** the user taps "Send Feedback" on the profile screen
- **THEN** a bottom sheet or modal appears with a text input and send button

#### Scenario: User submits feedback on mobile
- **WHEN** the user types a message and taps "Send"
- **THEN** the feedback is saved with platform='mobile', the form closes, and a success confirmation is shown

#### Scenario: User submits empty feedback
- **WHEN** the user taps "Send" with an empty text field
- **THEN** the send button SHALL be disabled or the submission SHALL be prevented with inline validation

### Requirement: Feedback submission form on web
The system SHALL display a "Send Feedback" option on the web interface accessible from the user's profile or settings area. The form SHALL be a modal containing the same fields as mobile: multiline text input and send button.

#### Scenario: User submits feedback on web
- **WHEN** a web user types a message and submits
- **THEN** the feedback is saved with platform='web', the modal closes, and a success confirmation is shown

### Requirement: Admin feedback list view
The admin panel SHALL include a "Feedback" navigation tab linking to `/admin/feedback`. This page SHALL display all feedback entries in reverse chronological order, showing: date, user display name, message (truncated to ~100 chars in list), platform, and status badge.

#### Scenario: Admin views feedback list
- **WHEN** an admin navigates to the feedback page
- **THEN** all feedback entries are displayed newest-first with user name, message preview, platform, and status

#### Scenario: Admin reads a feedback entry
- **WHEN** an admin clicks on a feedback entry
- **THEN** the full message is shown and the status is updated from 'new' to 'read' (if currently 'new')

#### Scenario: Admin resolves feedback
- **WHEN** an admin marks a feedback entry as resolved
- **THEN** the status changes to 'resolved' and the entry shows as resolved in the list

### Requirement: Unread feedback count on admin dashboard
The admin dashboard overview page SHALL display the count of feedback entries with status='new' alongside existing stats (users, recipes, invites).

#### Scenario: Dashboard shows unread count
- **WHEN** an admin views the admin dashboard
- **THEN** an "Unread feedback" stat card displays the count of feedback with status='new'

#### Scenario: No unread feedback
- **WHEN** all feedback entries are 'read' or 'resolved'
- **THEN** the unread feedback stat shows 0
