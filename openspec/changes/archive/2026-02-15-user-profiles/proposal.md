## Why

Users need profiles to establish identity and attribution in the social recipe platform. Profiles enable discovery ("who created this recipe?"), social connections (following friends), and personalization. Privacy controls let users choose between public social sharing (default) and private, friends-only mode—similar to Instagram's public/private account model.

## What Changes

- **User profiles table** — Store display name, avatar, bio, role (user/creator/admin), plan (free/premium), and privacy settings
- **Profile privacy controls** — Users can set profile to public (default) or private
  - Public profiles: anyone can follow, see public recipes and activity
  - Private profiles: must approve follow requests, only approved followers see recipes and activity
- **Follow request approval** — For private profiles, follow attempts create pending requests that the user can approve/deny
- **Profile pages** — Public-facing profile pages showing user info, public recipes, stats (recipes published, times cooked)
- **Profile editing UI** — Edit display name, avatar, bio, privacy settings (web + mobile)
- **Auto-profile creation** — Database trigger creates profile when user signs up (email-derived display name, public by default)
- **Avatar upload** — Upload and crop profile pictures via Supabase Storage

## Capabilities

### New Capabilities
- `user-profiles`: User profile creation, editing, display, privacy controls, and follow request approval system

### Modified Capabilities
- `social-platform`: Update follow requirements to handle private profiles and follow request approval

## Impact

**Database:**
- New table: `user_profiles` (id, display_name, avatar_url, bio, role, plan, is_private, created_at, updated_at)
- New table: `follow_requests` (id, requester_id, target_id, status, created_at)
- Modify: `user_follows` table to enforce privacy (only approved follows for private profiles)
- Database trigger: auto-create profile on user signup
- RLS policies: profile read (public profiles visible to all, private profiles only to approved followers), profile write (owner only)

**Backend:**
- Profile CRUD endpoints/queries
- Avatar upload flow (Supabase Storage)
- Follow request approval logic
- Privacy enforcement in queries (filter recipes/activity by profile privacy + follow status)

**Frontend (Web):**
- Profile edit page (`/profile/edit`)
- Public profile page (`/profile/[userId]`)
- Avatar upload component with crop
- Privacy settings toggle

**Frontend (Mobile):**
- Profile tab (own profile with edit button)
- Profile screen (other users' profiles)
- Follow/Request to Follow button (changes based on privacy)
- Avatar upload via camera/library

**Free vs Premium:**
- All users get profiles (no premium gate)
- Future: Premium users might get enhanced profiles (verified badges, analytics)
