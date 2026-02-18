# Admin Panel

## Requirements

### Requirement: Admin route protection
The system SHALL restrict all `/admin` routes to users with `role = 'admin'` in `user_profiles`. Non-admin users SHALL be redirected to `/recipes`.

#### Scenario: Admin accesses admin panel
- **WHEN** a user with `role = 'admin'` navigates to `/admin`
- **THEN** the admin dashboard is displayed

#### Scenario: Non-admin denied access
- **WHEN** a user with `role = 'user'` navigates to `/admin`
- **THEN** they are redirected to `/recipes`

#### Scenario: Unauthenticated user denied access
- **WHEN** an unauthenticated visitor navigates to `/admin`
- **THEN** they are redirected to `/login`

### Requirement: Admin dashboard with platform stats
The admin dashboard at `/admin` SHALL display summary statistics: total users, total recipes, total invites (with used/pending breakdown).

#### Scenario: Dashboard displays stats
- **WHEN** an admin visits `/admin`
- **THEN** the page displays total user count, total recipe count, total invite count, and count of pending vs used invites

### Requirement: User list with search
The admin users page at `/admin/users` SHALL display all users with their email, display name, role, plan, recipe count, and join date. The list SHALL be searchable by email or display name.

#### Scenario: Admin views user list
- **WHEN** an admin visits `/admin/users`
- **THEN** all users are listed with email, display name, role, plan, recipe count, and join date

#### Scenario: Admin searches users
- **WHEN** an admin types a search query
- **THEN** the user list filters to show only users whose email or display name matches

### Requirement: Delete user
An admin SHALL be able to delete a non-admin user. Deletion MUST cascade (remove all user data). Admins SHALL NOT be able to delete other admin users.

#### Scenario: Admin deletes a regular user
- **WHEN** an admin clicks delete on a user with `role = 'user'`
- **AND** confirms the deletion
- **THEN** the user is deleted via Supabase admin API (cascading) and removed from the list

#### Scenario: Admin cannot delete another admin
- **WHEN** an admin attempts to delete a user with `role = 'admin'`
- **THEN** the delete action is not available

#### Scenario: Deletion requires confirmation
- **WHEN** an admin clicks delete on a user
- **THEN** a confirmation dialog appears before the deletion proceeds

### Requirement: Invite list
The admin invites page at `/admin/invites` SHALL display all invites across all users, showing: inviter name, invitee email, invite code, status (pending/used), and creation date.

#### Scenario: Admin views all invites
- **WHEN** an admin visits `/admin/invites`
- **THEN** all invites from all users are displayed with inviter name, invitee email, code, status, and date

### Requirement: Revoke unused invite
An admin SHALL be able to revoke (delete) invites that have not been used. Used invites SHALL NOT be revocable.

#### Scenario: Admin revokes a pending invite
- **WHEN** an admin clicks revoke on an invite without `used_at`
- **THEN** the invite row is deleted and removed from the list

#### Scenario: Used invite cannot be revoked
- **WHEN** an invite has a `used_at` timestamp
- **THEN** the revoke action is not available

### Requirement: Seed admin users
A database migration SHALL set `role = 'admin'` for bwhessels@gmail.com and mjavaneeuwijk@gmail.com.

#### Scenario: Migration seeds admins
- **WHEN** the migration runs
- **THEN** the `user_profiles` rows for these two emails have `role = 'admin'`
