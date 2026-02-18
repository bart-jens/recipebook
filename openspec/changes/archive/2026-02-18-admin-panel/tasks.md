## 1. Database

- [x] 1.1 Create migration to seed admin role for bwhessels@gmail.com and mjavaneeuwijk@gmail.com

## 2. Admin Layout & Route Protection

- [x] 2.1 Create `/admin` layout with admin role check (redirect non-admins)
- [x] 2.2 Add admin nav link to main app header (visible only to admins)

## 3. Admin Dashboard

- [x] 3.1 Create `/admin` dashboard page with platform stats (users, recipes, invites)

## 4. User Management

- [x] 4.1 Create `/admin/users` page — list all users with email, name, role, plan, recipe count, join date
- [x] 4.2 Add search/filter for user list
- [x] 4.3 Add delete user server action (admin API, cascading, blocked for admin-role users)
- [x] 4.4 Add delete confirmation dialog

## 5. Invite Management

- [x] 5.1 Create `/admin/invites` page — list all invites with inviter, email, code, status, date
- [x] 5.2 Add revoke invite server action (delete row, only for unused invites)
