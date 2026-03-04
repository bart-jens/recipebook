## 1. Signup Page — Apple Button

- [x] 1.1 Add `handleOAuth` function to `SignupForm` that calls `supabase.auth.signInWithOAuth` with provider `apple`, passing `invite_code` from the current `code` state as `options.queryParams.state` (JSON-encoded)
- [x] 1.2 Add "Sign up with Apple" button above the email/password form in `SignupForm`, matching the login page Apple button styling (black bg, Apple SVG icon)
- [x] 1.3 Add "or" divider between the Apple button and the email/password fields
- [x] 1.4 Wire loading/disabled state: Apple button disabled while `loading` is true

## 2. Auth Callback — Forward Invite Code

- [x] 2.1 In `/auth/callback/route.ts`, after detecting a new user, parse the `state` query param from the OAuth redirect URL
- [x] 2.2 If `state` contains a valid JSON `invite_code` field, append `?code=<invite_code>` to the `/signup/verify-invite` redirect URL
- [x] 2.3 If `state` is absent or malformed, redirect to `/signup/verify-invite` with no code param (existing behavior)

## 3. Verify-Invite Page — Pre-fill and Auto-submit

- [x] 3.1 In `verify-invite/page.tsx`, read the `code` query param using `useSearchParams`
- [x] 3.2 Pre-fill the invite code input with the `code` param value if present
- [x] 3.3 Add a `useEffect` that triggers form submission on mount if a `code` param is present (auto-submit the pre-filled code)
- [x] 3.4 Show a loading state immediately when auto-submitting so the page doesn't flash the form
- [x] 3.5 On auto-submit failure (invalid/used code), display the error and leave the input editable for manual correction
