## 1. Database: Tables and Triggers

- [x] 1.1 Create `user_profiles` table with columns: id (uuid PK, FK auth.users), display_name (text NOT NULL), avatar_url (text), bio (text), role (text default 'user', CHECK user/creator/admin), plan (text default 'free', CHECK free/premium), is_private (boolean NOT NULL default false), created_at, updated_at
- [x] 1.2 Create `follow_requests` table with columns: id (uuid PK), requester_id (uuid FK auth.users ON DELETE CASCADE), target_id (uuid FK auth.users ON DELETE CASCADE), created_at. Add unique(requester_id, target_id) and CHECK(requester_id != target_id)
- [x] 1.3 Create `handle_new_user()` trigger function on auth.users INSERT that creates a user_profiles row with email-derived display_name and is_private = false
- [x] 1.4 Backfill existing auth.users — INSERT user_profiles for all existing users who don't have one yet

## 2. Database: RLS Policies

- [x] 2.1 Enable RLS on `user_profiles`. Add read policy: all profiles visible to authenticated users (profile row itself is always visible; recipe/activity filtering is handled at query level). Add update policy: owner only (auth.uid() = id). No insert policy (trigger handles creation). No delete policy.
- [x] 2.2 Enable RLS on `follow_requests`. Add read policy: requester or target can see. Add insert policy: requester = auth.uid(), target must be a private user, no existing follow or pending request. Add delete policy: requester can cancel (auth.uid() = requester_id) or target can deny (auth.uid() = target_id).
- [x] 2.3 Update RLS on `user_follows`. Add insert policy: follower = auth.uid() AND target is public profile (private profiles can only be followed via approval). Add delete policy: follower can unfollow (auth.uid() = follower_id).

## 3. Database: Storage

- [x] 3.1 Create Supabase Storage bucket `avatars` (public bucket). Add policy: authenticated users can upload to their own path (`{userId}/*`). Add policy: public read access for all avatar files.

## 4. Web: Profile Editing

- [x] 4.1 Create profile edit page at `/profile/edit` with form fields: display_name (required), bio (max 300 chars), privacy toggle (is_private). Save updates to user_profiles via Supabase client.
- [x] 4.2 Add avatar upload component to profile edit page. Client-side crop to 1:1 square, resize to 512x512, upload to `avatars/{userId}/{timestamp}.jpg`, update avatar_url on profile.
- [x] 4.3 Add default avatar component (initials on colored background) for users without avatar_url.

## 5. Web: Public Profile Page

- [x] 5.1 Create public profile page at `/profile/[userId]` showing display_name, avatar, bio, and stats (recipes published, times cooked, followers, following).
- [x] 5.2 Add public recipes grid to profile page — show user's public recipes. For private profiles viewed by non-followers, hide recipes section and show "This account is private" message.
- [x] 5.3 Add Follow / Request to Follow / Following / Requested button component. Button state depends on target's is_private flag and current relationship (not following, following, request pending).
- [x] 5.4 Add "Edit Profile" button on own profile page, linking to `/profile/edit`.

## 6. Web: Follow Request Management

- [x] 6.1 Create follow requests page/section accessible from profile settings. List pending follow_requests with requester display_name and avatar. Approve and deny buttons per request.
- [x] 6.2 Approve action: insert into user_follows, delete from follow_requests. Deny action: delete from follow_requests only.
- [x] 6.3 Add pending request count badge on navigation (visible when user has is_private = true and pending requests > 0).

## 7. Web: Privacy Toggle Behavior

- [x] 7.1 When switching from private to public: auto-approve all pending follow_requests (batch insert into user_follows, batch delete from follow_requests).
- [x] 7.2 When switching from public to private: preserve existing followers (no changes to user_follows).

## 8. Mobile: Profile Tab

- [x] 8.1 Update Profile tab to display current user's profile: avatar, display_name, bio, stats, and public recipes grid.
- [x] 8.2 Add "Edit Profile" button navigating to profile edit screen.
- [x] 8.3 Create profile edit screen with fields: display_name, bio, privacy toggle. Save to Supabase.
- [x] 8.4 Add avatar upload on mobile: tap avatar to choose camera or photo library, crop to square, resize to 512x512, upload to storage.
- [x] 8.5 Add pending follow request count badge on Profile tab icon (for private users with pending requests).

## 9. Mobile: Other User Profile Screen

- [x] 9.1 Create user profile screen (navigated to from recipe creator name, discover, etc.) showing display_name, avatar, bio, stats.
- [x] 9.2 Add Follow / Request to Follow / Following / Requested button with same logic as web.
- [x] 9.3 Show public recipes grid for public profiles. Show "This account is private" for private profiles viewed by non-followers. Show full content for approved followers.

## 10. Mobile: Follow Request Management

- [x] 10.1 Create follow requests screen accessible from profile tab. List pending requests with approve/deny actions.
- [x] 10.2 Implement approve (insert follow + delete request) and deny (delete request) actions.
