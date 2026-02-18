## 1. Database

- [x] 1.1 Create migration for `feedback` table with columns: id (uuid PK), user_id (uuid FK), message (text NOT NULL), platform (text NOT NULL), app_version (text), source_screen (text), status (text DEFAULT 'new'), metadata (jsonb DEFAULT '{}'), created_at (timestamptz DEFAULT now()). Add CHECK constraints for non-empty message and valid status/platform values.
- [x] 1.2 Add RLS policies: users INSERT own rows (user_id = auth.uid()), admins SELECT all, admins UPDATE status. No DELETE policy.

## 2. Mobile — Feedback Form

- [x] 2.1 Add "Send Feedback" button to profile screen between "Invite Friends" and "Sign out"
- [x] 2.2 Create feedback bottom sheet / modal component with multiline text input, send button, close control, and loading/success states
- [x] 2.3 Wire up submission: insert to `feedback` table with platform='mobile', source_screen, and app version. Show success confirmation and close modal.

## 3. Web — Feedback Form

- [x] 3.1 Add "Send Feedback" button/link to the web profile or settings area
- [x] 3.2 Create feedback modal component with multiline text input, submit button, and loading/success states
- [x] 3.3 Wire up submission: insert to `feedback` table with platform='web' and source context

## 4. Admin Panel

- [x] 4.1 Add "Feedback" tab to admin layout navigation
- [x] 4.2 Create admin feedback list page at `/admin/feedback` showing all entries reverse-chronological with date, user name, message preview, platform badge, and status badge
- [x] 4.3 Add expand/detail view: clicking an entry shows full message and auto-marks 'new' → 'read'. Add "Resolve" button to mark as 'resolved'.
- [x] 4.4 Add "Unread feedback" stat card to admin dashboard overview page
