## Why

There's no admin interface — all user/invite management happens through the Supabase dashboard. As the platform grows beyond two people, we need a lightweight admin panel to manage users and invites without touching the database directly.

## What Changes

- **Admin route group** (`/admin`) — Protected pages accessible only to users with `role = 'admin'`. Middleware checks role on the user profile and redirects non-admins.
- **User management** — List all users with search, view key details (email, role, plan, recipe count, joined date). Ability to delete users (cascading delete via Supabase admin API).
- **Invite management** — List all invites across all users (inviter, email, code, status). Ability to revoke unused invites (delete row).
- **Dashboard** — Simple stats overview: total users, total recipes, total invites (used/pending).
- **Seed admins** — Migration to set `role = 'admin'` for bwhessels@gmail.com and mjavaneeuwijk@gmail.com.
- **Web only** — No mobile admin UI. Admin work happens at a desk, not in the kitchen.

## Capabilities

### New Capabilities

- `admin-panel`: Admin dashboard, user management (list, search, delete), invite management (list, revoke), admin-only route protection

### Modified Capabilities

_(none — this is additive, no existing behavior changes)_

## Impact

**Database:** New RLS policies allowing admin role to read all user_profiles and invites. Migration to seed admin roles.
**Web:** New `/admin` route group with layout, dashboard, users, and invites pages. Server actions for delete/revoke operations using Supabase admin client.
**Auth:** Middleware or layout-level role check to gate admin routes.
