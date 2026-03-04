## Why

The signup page (`/signup`) only offers email + password — users who arrive via an invite link have no way to sign up with Apple. The Apple button only exists on the login page, which is for returning users. This is unnecessary friction for new users on iOS who would prefer Sign in with Apple.

## What Changes

- Add "Sign in with Apple" button to the signup page (`/signup`), shown above the email/password form with an "or" divider
- Pass the invite code as OAuth `state` when initiating Apple OAuth from the signup page
- Update `/auth/callback` to read the invite code from OAuth state and redirect to `/signup/verify-invite?code=<code>` so the code is pre-filled
- Update the verify-invite page to accept a pre-filled code and auto-submit if valid, making the flow seamless for users who arrived with a valid invite link

## Capabilities

### New Capabilities

None — this change extends existing capabilities rather than introducing new ones.

### Modified Capabilities

- `social-login`: Add requirement that the signup page SHALL offer Apple sign-in as an alternative to email/password. When initiated from the signup page, the invite code SHALL be carried through the OAuth state so the verify-invite step can be pre-filled and auto-submitted.
- `auth`: Add requirement that `/auth/callback` SHALL read invite code from OAuth state and pass it forward to the verify-invite screen.

## Impact

- `src/app/signup/signup-form.tsx` — add Apple button and OAuth handler
- `src/app/auth/callback/route.ts` — read `invite_code` from OAuth state, append to redirect URL
- `src/app/signup/verify-invite/page.tsx` — accept `code` query param, pre-fill input, auto-submit if present
- `src/app/signup/verify-invite/actions.ts` — no changes needed
- Web only (mobile already uses native Apple Sign-In with its own invite check flow)
