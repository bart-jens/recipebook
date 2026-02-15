## Why

The current auth flow is email/password only, which creates friction — especially on mobile where typing passwords is painful. Adding Google and Apple OAuth login reduces signup/login to a single tap. Apple login is also required by the App Store if you offer any third-party login option, so this is a prerequisite for App Store submission.

## What Changes

- **Google OAuth login** — Sign in with Google on both web and mobile
- **Apple OAuth login** — Sign in with Apple on both web and mobile (required by App Store)
- **Updated login/signup UI** — Social login buttons alongside existing email/password form
- **Account linking** — If a user signs up with email and later logs in with Google using the same email, the accounts are linked automatically
- **Invite code check on social signup** — New users signing up via social login must still provide a valid invite code (invite-first model preserved)
- **Profile trigger compatibility** — Existing `handle_new_user()` trigger works for social signups (email-derived display name fallback to OAuth display name)

## Capabilities

### New Capabilities
- `social-login`: Google and Apple OAuth login flows for web and mobile, with invite code enforcement

### Modified Capabilities
- `auth`: Update login/signup requirements to include social login options alongside email/password

## Impact

**Backend / Supabase:**
- Enable Google and Apple providers in Supabase Auth dashboard
- Configure OAuth credentials (Google Cloud Console, Apple Developer Account)
- Update `handle_new_user()` trigger to use OAuth display name when available (from `raw_user_meta_data`)

**Frontend (Web):**
- Update login page with Google and Apple login buttons
- Update signup page to include social login + invite code flow
- Handle OAuth redirect callback

**Frontend (Mobile):**
- Add Google Sign-In via `expo-auth-session` or Supabase's OAuth flow
- Add Apple Sign-In via `expo-apple-authentication`
- Handle deep link callback for OAuth redirects

**External Dependencies:**
- Google Cloud Console: OAuth 2.0 client ID + secret
- Apple Developer Account: Service ID, key, and certificates for Sign in with Apple
- Supabase Dashboard: Enable providers, configure redirect URLs

**Free vs Premium:**
- No premium gate — social login is available to all users
