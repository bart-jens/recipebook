## Context

EefEats is invite-only. Currently, inviters share a short alphanumeric code (e.g. `ABC123`) that invitees manually type on the signup page. This creates unnecessary friction: copy a code, open a browser, navigate to the signup URL, then paste it. For iOS sharing via Messages or WhatsApp, a tappable link is far more natural.

The `invites` table already exists with `invited_by`, `email`, `code`, and `used_at` columns. The `/signup` page already reads `?code=` from the URL. The missing piece is a stable per-user URL that auto-generates a code on arrival.

## Goals / Non-Goals

**Goals:**
- One shareable URL per user that works for unlimited invitees
- Zero friction for invitees: tap link → land on pre-filled signup form
- No new UI on the web signup side (reuse existing `?code=` flow)
- "Copy invite link" in mobile app so users can share via any channel

**Non-Goals:**
- Per-invite analytics / tracking which link converted
- Expiring or revokable individual invite links
- Invite limits (future premium feature)
- Deep link to the mobile app (web signup is the right entry point)

## Decisions

### Stable token in a separate `user_invite_tokens` table

The inviter's public token is stored in a dedicated `user_invite_tokens(user_id, invite_token)` table rather than as a column on `user_profiles`. This is necessary because `user_profiles` has a `using (true)` SELECT policy — PostgreSQL RLS is row-level only, so there is no way to hide a single column without a view. A separate table allows a proper ownership-scoped policy (`using (auth.uid() = user_id)`), preventing any user from reading another user's token via the client.

**Alternative considered:** A column on `user_profiles`. Rejected: would expose `invite_token` to all authenticated users via the existing public SELECT policy, violating the security requirement.

### Server-side code generation at link visit time

`GET /i/[token]` is a Next.js Route Handler (not a page). It:
1. Queries `user_profiles` for the inviter by `invite_token`
2. Generates a fresh one-time code (`nanoid(8)`)
3. Inserts a row into `invites` with `invited_by = inviter_id`, `code`, and `used_at = null`
4. Redirects `307` to `/signup?code=<code>`

**Alternative considered:** Reuse the invite_token itself as the signup code. Rejected: the token is public (embedded in a shareable URL) and must remain valid across multiple uses. A single-use code is a separate, private, ephemeral thing.

### No RLS exposure of `invite_token` to other users

The `invite_token` is needed only server-side (the Route Handler uses the service role key). The `user_profiles` SELECT policy for other users must NOT expose `invite_token`. The mobile "Copy invite link" button constructs the URL client-side from the token returned by a dedicated RPC or by the user's own profile read.

### Mobile sharing via clipboard (not native share sheet)

A single "Copy invite link" button writes `https://eefeats.com/i/<token>` to the clipboard. Users paste it wherever they want (Messages, WhatsApp, email).

**Alternative considered:** Native share sheet (`Share.share()`). Deferred — clipboard is simpler and sufficient for now; share sheet can be layered on later.

## Risks / Trade-offs

- **Token exposure:** The `invite_token` is embedded in a public URL. It reveals nothing about the inviter beyond "this person invited you." It cannot be used to gain any access on its own. Low risk.
- **Code farming:** Someone could hit `/i/[token]` repeatedly to generate many valid codes. Mitigation: each code is single-use; codes are cheap to generate; no rate limiting needed at this scale.
- **Stale codes:** If a user generates a link and the invitee never clicks it, orphan rows accumulate in `invites`. Mitigation: low volume, easy to clean up with a scheduled job later.

## Migration Plan

1. Write and apply Supabase migration: add `invite_token` column to `user_profiles`, backfill existing rows with `gen_random_uuid()`, add UNIQUE constraint, update RLS policies.
2. Deploy web Route Handler `/i/[token]`.
3. Ship mobile "Copy invite link" button.
4. No rollback complexity — migration is additive; removing the column later is safe.
