## Context

EefEats is adding user profiles as the foundation for social features. Currently, users are authenticated via Supabase Auth but have no profile data (display name, avatar, bio). This change introduces user profiles with Instagram-style privacy controls: public by default, with an option to go private and require follow approval.

**Current State:**
- Users exist in `auth.users` (Supabase Auth)
- Recipes reference `created_by` (user ID) but have no profile display data
- No social graph (follows, followers)
- No user-facing profile pages

**Constraints:**
- Must work with existing Supabase Auth (can't replace auth system)
- Privacy must be enforceable at database level (RLS policies)
- Default behavior: fully public (low friction for onboarding)
- Mobile-first: all features must work on small screens with touch

## Goals / Non-Goals

**Goals:**
- User profiles with display name, avatar, bio, role, plan, and privacy settings
- Instagram-style privacy: public (anyone can follow) or private (approval required)
- Follow request approval workflow for private profiles
- Auto-create profiles on signup (zero friction)
- Avatar upload with client-side crop
- Public profile pages showing recipes and stats
- Profile editing UI (web + mobile)
- RLS policies enforce privacy at database level

**Non-Goals:**
- Creator-specific profile features (verified badges, subscriber counts) — separate change
- Profile customization (themes, banners) — future
- Blocking users — future
- Profile analytics — future
- Two-factor auth or account security settings — separate concern

## Decisions

### 1. Database Schema: `user_profiles` Table

**Decision:** Create a separate `user_profiles` table (1:1 with `auth.users`) instead of using Supabase's `auth.users.raw_user_meta_data`.

**Rationale:**
- `raw_user_meta_data` is a JSONB field with no schema validation
- Can't add RLS policies or indexes on JSONB fields efficiently
- Separation of concerns: auth data vs profile data
- Easier to query and join

**Schema:**
```sql
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'creator', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Alternatives considered:**
- Using `raw_user_meta_data`: Rejected due to lack of schema enforcement and RLS complexity
- Adding columns to `auth.users`: Not possible (managed by Supabase)

### 2. Privacy Model: Boolean Flag vs Visibility Enum

**Decision:** Use `is_private` boolean flag (not a visibility enum like `public|private|unlisted`).

**Rationale:**
- Simpler: only two states needed (public or private)
- Matches Instagram's model (familiar UX)
- Easier RLS policies (boolean checks vs string matching)
- Can add "unlisted" later if needed without breaking changes

### 3. Follow Request Workflow: `follow_requests` Table

**Decision:** Create a separate `follow_requests` table for pending follow requests instead of adding a `status` column to `user_follows`.

**Rationale:**
- Clean separation: `user_follows` only contains approved follows
- Simpler queries: no need to filter by status everywhere
- Follow request approval doesn't clutter the main social graph

**Schema:**
```sql
create table follow_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(requester_id, target_id),
  check (requester_id != target_id)
);
```

**Flow:**
1. User A clicks "Follow" on private profile B → INSERT into `follow_requests`
2. User B sees pending request → UI to approve/deny
3. Approve → INSERT into `user_follows`, DELETE from `follow_requests`
4. Deny → DELETE from `follow_requests`
5. Cancel → Requester can DELETE their own row

**Alternatives considered:**
- Status column in `user_follows` (`pending|approved`): Rejected due to query complexity
- No table (manual approval via notifications): Rejected—need durable state

### 4. RLS Policies: Privacy Enforcement

**Decision:** Enforce privacy at the database level using RLS policies, not application logic.

**user_profiles read policy:**
```sql
-- Public profiles: visible to everyone
-- Private profiles: visible to owner + approved followers
create policy "user_profiles_read" on user_profiles
  for select using (
    not is_private  -- public profiles
    or auth.uid() = id  -- own profile
    or exists (  -- approved follower
      select 1 from user_follows
      where follower_id = auth.uid() and following_id = id
    )
  );
```

**user_profiles write policy:**
```sql
-- Only owner can update their own profile
create policy "user_profiles_update" on user_profiles
  for update using (auth.uid() = id);
```

**follow_requests read policy:**
```sql
-- Only requester and target can see their own requests
create policy "follow_requests_read" on follow_requests
  for select using (
    auth.uid() = requester_id or auth.uid() = target_id
  );
```

**Rationale:**
- Security by default: can't bypass with buggy client code
- Works across web, mobile, and future API clients
- Easier to audit and test

### 5. Avatar Upload: Supabase Storage

**Decision:** Use Supabase Storage with client-side image cropping before upload.

**Bucket:** `avatars` (public bucket, authenticated uploads only)

**Path structure:** `{userId}/{timestamp}.{ext}`
- Example: `a1b2c3d4-5678-90ab-cdef-1234567890ab/1708012345.jpg`
- Timestamp prevents caching issues when updating avatar
- Old avatars left in place (cheap storage, allows rollback/moderation)

**Client-side crop:**
- Web: Use a library like `react-easy-crop`
- Mobile: Use `expo-image-manipulator` or similar
- Crop to square (1:1 aspect ratio) before upload
- Resize to max 512x512 (reduce upload size)

**Upload flow:**
1. User selects image
2. Client crops to square, resizes to 512x512
3. Client uploads to `avatars/{userId}/{timestamp}.jpg`
4. Client updates `user_profiles.avatar_url` with Storage public URL
5. UI displays new avatar immediately (no server-side processing)

**Alternatives considered:**
- Server-side cropping: Rejected—adds latency and server complexity
- Storing avatars as base64 in DB: Rejected—bloats DB, slow queries

### 6. Auto-Profile Creation: Database Trigger

**Decision:** Use a PostgreSQL trigger to auto-create profiles when users sign up.

**Trigger:**
```sql
create function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, display_name, is_private)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    false  -- default to public
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

**Rationale:**
- Zero friction: users don't need to manually create a profile
- Atomic: profile creation tied to signup
- Fallback display name: email prefix (e.g., `bart@example.com` → `bart`)
- Users can edit later

**Alternatives considered:**
- Application-level profile creation: Rejected—could fail after auth succeeds
- Manual profile creation step: Rejected—adds friction to onboarding

### 7. Profile Stats Calculation

**Decision:** Calculate stats on-demand with SQL queries, not cached columns.

**Stats to show:**
- Recipes published (count public recipes by user)
- Times cooked (count ratings by user)
- Followers / Following (count from `user_follows`)

**Rationale:**
- Stats change infrequently (not real-time critical)
- Simple queries (no complex aggregations)
- Avoids cache invalidation complexity
- Can optimize later with materialized views if needed

**Query examples:**
```sql
-- Recipes published
select count(*) from recipes
where created_by = $1 and visibility = 'public';

-- Times cooked (ratings = cooked)
select count(*) from recipe_ratings
where user_id = $1;

-- Followers
select count(*) from user_follows
where following_id = $1;

-- Following
select count(*) from user_follows
where follower_id = $1;
```

## Risks / Trade-offs

### [Risk] Private profiles break discovery
**Mitigation:** Only recipes are private, not the profile itself. Private users still appear in search/discovery, but their recipes/activity are hidden to non-followers. This matches Instagram's UX.

### [Risk] Follow request spam
**Mitigation:**
- Phase 1: No mitigation (invite-only means trusted users)
- Future: Rate limiting on follow requests (max 100/day)
- Future: Block feature to prevent harassment

### [Risk] Old avatars accumulate in storage
**Mitigation:**
- Storage is cheap (~$0.02/GB/month)
- Can add cleanup job later (delete avatars not referenced in `user_profiles`)
- Keep for 30 days in case of accidental changes

### [Risk] Display name collisions
**Trade-off:** Display names are NOT unique (like Instagram). Users are identified by unique URLs (`/profile/{userId}`), not display names. This allows duplicate names (e.g., multiple "John Smith" users).

**Why not usernames?** Usernames add onboarding friction (must be unique, users need to think of one). Display names are simpler and more personal.

### [Risk] Email-derived display names might be ugly
**Mitigation:** Users can immediately edit their display name after signup. The email prefix is just a sensible default, not a permanent name.

### [Risk] RLS policies may have performance impact
**Mitigation:**
- Add indexes on foreign keys (`user_follows.follower_id`, `user_follows.following_id`)
- RLS queries are simple (EXISTS checks on indexed columns)
- Can add query performance tests later

## Migration Plan

**Phase 1: Database (no user-visible changes)**
1. Create `user_profiles` table
2. Create `follow_requests` table
3. Add trigger for auto-profile creation
4. Add RLS policies
5. Backfill existing users (run INSERT for all `auth.users`)

**Phase 2: Backend API**
1. Profile CRUD queries (get, update)
2. Follow request logic (create, approve, deny, cancel)
3. Privacy-aware queries for recipes/activity (filter by follow status)

**Phase 3: Frontend (Web)**
1. Profile edit page (`/profile/edit`)
2. Public profile page (`/profile/[userId]`)
3. Avatar upload component
4. Privacy settings toggle
5. Follow/request button component

**Phase 4: Frontend (Mobile)**
1. Profile tab (own profile)
2. Profile screen (other users)
3. Avatar upload (camera/library)
4. Follow/request button

**Rollback:**
- Database changes are additive (no data loss if rolled back)
- Drop trigger, tables, and policies to rollback
- Existing auth.users unaffected

## Open Questions

None. Design is ready for implementation.
