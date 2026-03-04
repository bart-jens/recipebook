## Context

The signup page (`/signup`) is the landing point for users who follow an invite link (`/i/<token>` redirects to `/signup?code=XXXX`). Today it only offers email + password. The login page (`/login`) has an Apple button, but that's for returning users.

An OAuth invite flow already exists: if a user finds the Apple button on the login page and is a new user, `/auth/callback` redirects them to `/signup/verify-invite` to enter their invite code manually. This change extends that flow to the signup page and makes it seamless when the invite code is already known.

## Goals / Non-Goals

**Goals:**
- Allow new users to sign up with Apple from the signup page
- Carry the invite code through the OAuth state so the verify-invite step can auto-submit
- Make the happy path (invite link → Apple signup) require zero manual code entry

**Non-Goals:**
- Google OAuth on signup (Google is currently disabled on login too — custom domain not yet configured)
- Mobile changes (mobile has its own native Apple Sign-In flow)
- Linking Apple to an existing email/password account

## Decisions

### Pass invite code via `redirectTo` query param

Supabase's `signInWithOAuth` accepts a `redirectTo` URL — this is where Supabase redirects the user after completing OAuth. We embed the invite code as a query param on this URL (`/auth/callback?invite_code=XXXX`), which Supabase preserves through the redirect.

**Alternative considered**: OAuth `state` parameter via `options.queryParams.state`. Rejected — Supabase owns `state` internally for PKCE security and may override it. Piggybacking on `state` is unreliable.

**Alternative considered**: Store the invite code in a cookie before redirecting. Rejected — more moving parts, cookie scoping edge cases.

**Decision**: Append `invite_code=XXXX` to the `redirectTo` URL. In `/auth/callback`, read `searchParams.get("invite_code")` and forward it to the verify-invite redirect URL as `?code=XXXX`.

### Auto-submit on verify-invite when code is pre-filled

When the user arrives at `/signup/verify-invite?code=XXXX` with a valid-looking code in the URL, we pre-fill the input and trigger submission automatically (client-side `useEffect`). This makes the flow invisible for the happy path — user taps Apple, authorizes, lands in the app.

**Alternative considered**: Just pre-fill and let user tap "Continue". Simpler but adds friction for the exact case we're optimizing (invite link → Apple signup).

**Decision**: Auto-submit if `code` query param is present. Show a loading state immediately. If the code is invalid, show the error and let the user correct it manually.

### No changes to invite validation logic

The `verifyOAuthInvite` server action already does everything needed: validates the code, marks it used, redirects to `/recipes`. No changes needed there.

## Risks / Trade-offs

- **Race condition on auto-submit**: If the page renders and auto-submits before hydration completes, the action might not fire. Mitigation: trigger auto-submit in `useEffect` (client-side only, after mount).
- **User cancels Apple OAuth mid-flow**: Supabase redirects to `/auth/callback` without a code, which already redirects to `/login?error=auth`. The invite code in the URL is simply discarded. Correct behavior.
- **URL tampering**: An attacker could craft a `redirectTo` with an arbitrary invite code. This is fine — the verify-invite action validates the code in the DB. Passing a fake code just means validation fails.

## Migration Plan

No database changes. No breaking changes to existing flows. Deploy is a straight swap.

## Open Questions

None — scope is fully defined.
