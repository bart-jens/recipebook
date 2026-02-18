## Why

EefEats is invite-only with a small, trusted user base — the perfect moment to collect feedback directly from users. There's no way for users to report bugs, request features, or share thoughts from within the app. Feedback currently happens informally (WhatsApp, in-person) which means insights get lost. Adding an in-app feedback channel while the user base is small establishes the habit early and gives us structured, actionable input with automatic context (platform, screen, version).

## What Changes

- New `feedback` database table to store user-submitted feedback with auto-captured context
- "Send Feedback" button on the profile screen (mobile and web) opening a simple single-field form
- New "Feedback" tab in the admin panel to view, read, and resolve feedback
- Unread feedback count on the admin dashboard overview

## Capabilities

### New Capabilities
- `user-feedback`: In-app feedback submission (single text field + auto-captured context), storage, and admin management

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **Database**: New `feedback` table with RLS policies (users INSERT own, admins SELECT/UPDATE)
- **Mobile**: New feedback form screen, button added to profile screen
- **Web**: New feedback form component, button added to profile/settings area
- **Admin panel**: New feedback list page, nav tab, dashboard stat card
