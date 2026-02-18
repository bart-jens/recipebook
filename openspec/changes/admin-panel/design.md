## Context

The `admin` role exists in `user_profiles.role` but is unused. All admin operations (managing users, invites) currently require direct Supabase dashboard access. The `createAdminClient()` helper (service role key) already exists at `src/lib/supabase/admin.ts`.

## Goals / Non-Goals

**Goals:**
- Web-only admin panel at `/admin` with dashboard, user management, invite management
- Role-gated access: only `role = 'admin'` users can access
- Delete users (via Supabase admin API, cascading), revoke unused invites
- Seed bwhessels@gmail.com and mjavaneeuwijk@gmail.com as admins

**Non-Goals:**
- Mobile admin UI
- Content moderation (flagging/reporting recipes)
- Audit logging
- Role/plan editing UI (future extension)
- Impersonation

## Decisions

### 1. Route protection via server-side layout check (not middleware)

**Decision:** Check admin role in the `/admin` layout's server component. Non-admins get redirected to `/recipes`.

**Why not middleware?** Next.js middleware runs on the edge and can't easily query Supabase for profile data. A layout-level check is simpler, runs server-side, and follows the pattern already used for auth (`redirect("/login")`).

**Alternative considered:** Middleware with JWT claims — would require custom JWT hook in Supabase to embed role in the token. Overkill for now.

### 2. Server actions for mutations (not API routes)

**Decision:** Use Next.js server actions for delete user / revoke invite. Each action verifies the caller is an admin before proceeding.

**Why:** Consistent with existing patterns (`createInvite` in actions.ts). No need for separate API routes since this is web-only.

### 3. Hard delete for users via Supabase admin API

**Decision:** Use `adminClient.auth.admin.deleteUser(userId)` which cascades through all FK references. The user disappears completely.

**Why:** For a small invite-only platform, hard delete is appropriate. Soft delete adds complexity (disabled_at checks everywhere) without clear benefit at this scale. If a user needs to come back, they can be re-invited.

**Safeguard:** Admins cannot delete other admins (prevents accidental lockout).

### 4. Simple delete for invites

**Decision:** Delete the invite row directly via admin client. Only unused invites (no `used_at`) can be revoked.

**Why:** Used invites have a user attached — deleting the invite doesn't un-register the user. Revocation only makes sense for pending invites.

### 5. No new RLS policies needed

**Decision:** All admin queries use the service-role admin client which bypasses RLS.

**Why:** Admin operations are server-side only (server actions). The admin client already exists. Adding admin-specific RLS policies would be redundant since the admin client bypasses RLS anyway.

### 6. Admin seed via migration

**Decision:** SQL migration that sets `role = 'admin'` for the two specified email addresses by joining `auth.users` to `user_profiles`.

## Risks / Trade-offs

- **[Hard delete is irreversible]** → Confirmation dialog in UI. Admins can't delete other admins.
- **[Service role key in server actions]** → Already in use for signup. Server actions run server-side only, key never exposed to client.
- **[No audit log]** → Acceptable for 2 admins on a small platform. Add later if needed.
