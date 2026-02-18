## Context

EefEats has no in-app feedback mechanism. Users currently relay feedback informally. The app has an admin panel (web only) with dashboard stats, user management, and invite management. The profile screen (mobile and web) is the natural home for a "Send Feedback" action since it already hosts account-level actions (edit profile, invite friends, sign out).

## Goals / Non-Goals

**Goals:**
- Let any authenticated user submit freeform text feedback from within the app
- Auto-capture contextual metadata (platform, app version, source screen) without user effort
- Surface feedback in the admin panel with read/resolve workflow
- Show unread feedback count on admin dashboard

**Non-Goals:**
- Screenshot or image attachments
- In-app replies to feedback (use existing communication channels)
- Categories, tags, or structured feedback types
- Email/push notifications for new feedback
- Feedback analytics or sentiment analysis
- Public feedback board or voting

## Decisions

### 1. Single freeform text field (no categories)

At the current scale (<20 users), categorization adds friction without value. The admin can instantly classify feedback by reading it. If the user base grows significantly, categories can be added later without schema changes (the `metadata` JSONB column is there for future extension).

**Alternative considered:** Category dropdown (bug/feature/general) — rejected because it adds a decision point that reduces completion rate and provides little value at this scale.

### 2. Store in Supabase `feedback` table (not external service)

Keeps everything in one stack. The admin panel already exists and queries Supabase directly. No new dependencies, no new auth flows, no cost.

**Alternative considered:** External service (Canny, Intercom) — rejected as overkill for current scale and adds external dependency.

### 3. Feedback form as a modal/bottom sheet (not a separate screen)

Opening a lightweight modal keeps the user in context and feels lower-friction than navigating to a new screen. On mobile, a bottom sheet is native-feeling. On web, a centered modal.

**Alternative considered:** Separate /feedback route — rejected because it feels heavier than necessary for a single text field.

### 4. Auto-capture context silently

Store `platform` (web/mobile), `app_version`, and `source_screen` (the screen the user was on when they tapped feedback) automatically. This is invisible to the user but invaluable for debugging. No privacy concern since it's their own session context within the app they're already using.

### 5. Simple status workflow: new → read → resolved

Three states are enough. "New" means unread, "read" means seen but not acted on, "resolved" means done. No assignees, no priorities, no SLAs — this is a two-person operation.

### 6. Entry point: profile screen action button

Place "Send Feedback" in the profile screen's action section on both mobile and web. This is discoverable (profile is one tap away) and follows convention (settings/account area is where users expect feedback options).

## Risks / Trade-offs

- **Low discoverability** → Users may not think to look in their profile for feedback. Mitigation: acceptable at current scale since you can tell early users directly. Can add a home screen prompt later if needed.
- **No spam protection** → Any authenticated user can submit unlimited feedback. Mitigation: invite-only means trusted users. Add rate limiting (e.g., max 10/day) via a CHECK or app-level guard if this becomes an issue after open signups.
- **No notification to admin** → New feedback sits in the table until an admin checks. Mitigation: add unread count to admin dashboard so it's visible on every admin visit. Email notifications can be added later via a Supabase webhook/edge function.
