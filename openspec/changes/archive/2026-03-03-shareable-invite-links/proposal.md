## Why

Sending invite codes requires users to copy a code and type it manually, which is error-prone and adds friction. A shareable link lets existing users onboard friends in one tap — forward a URL, friend taps it, lands directly on the signup form with everything pre-filled.

## What Changes

- Add `invite_token` column (UUID) to `user_profiles` — stable per-user token that never changes
- New web route `GET /i/[token]` — looks up the inviter, generates a fresh one-time invite code, inserts it into the `invites` table (with `invited_by` set), and redirects to `/signup?code=XXXXX`
- "Copy invite link" button added to the mobile invites screen — copies `https://eefeats.com/i/[token]` to clipboard
- No limit on uses: every visitor to the invite link gets their own fresh code
- Invite-only signup is preserved — `/signup` still requires a valid `code` param

## Capabilities

### New Capabilities

- `shareable-invite-links`: Per-user stable invite URL that auto-generates one-time codes and redirects to signup

### Modified Capabilities

- `auth`: Invite flow now supports link-based entry in addition to manual code entry; `/signup?code=` can be pre-filled via redirect from `/i/[token]`

## Impact

- **Database:** `user_profiles` table (add `invite_token UUID UNIQUE DEFAULT gen_random_uuid()`); `invites` table already exists
- **Web:** New route `src/app/i/[token]/route.ts` (Next.js route handler); `/signup` page already reads `?code=` from URL params
- **Mobile:** `mobile/app/(tabs)/profile.tsx` or invites screen — add "Copy invite link" button
- **No breaking changes** — existing manual invite code flow is unchanged
