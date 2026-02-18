## Context

EefEats currently supports email/password authentication only via Supabase Auth. The app is invite-first: no public registration, users join via invite codes. Both web (Next.js) and mobile (Expo) share the same Supabase backend. Adding social login must preserve the invite-first model while reducing signup friction.

**Current state:**
- Login page with email/password form
- Signup with invite code + email/password
- `handle_new_user()` trigger creates user_profiles on signup using email-derived display name
- Mobile auth uses `@supabase/supabase-js` with email/password

## Goals / Non-Goals

**Goals:**
- Google OAuth login on web and mobile
- Apple OAuth login on web and mobile
- Preserved invite-first model (social signups still require invite code)
- Automatic account linking by email
- Updated profile trigger to use OAuth display name
- Seamless UX — single-tap login on mobile

**Non-Goals:**
- Other OAuth providers (GitHub, Facebook, etc.) — can add later with same pattern
- Magic link / passwordless email login — separate change if needed
- Migrating away from Supabase Auth — just adding providers to it
- Two-factor authentication — future enhancement

## Decisions

### 1. OAuth Flow: Supabase's Built-in Provider Flow

**Decision:** Use Supabase Auth's built-in OAuth provider support (`signInWithOAuth`) rather than handling OAuth tokens manually.

**Web flow:**
```typescript
// Initiate login
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

**Mobile flow (Expo):**
- Use `expo-auth-session` to handle the OAuth redirect
- Exchange the auth code with Supabase using `signInWithOAuth` or `signInWithIdToken`
- For Apple on iOS: use `expo-apple-authentication` for native Sign in with Apple, then pass the id_token to Supabase via `signInWithIdToken`

**Rationale:**
- Supabase handles token exchange, session creation, and user creation
- No need to manage OAuth tokens ourselves
- Works with existing session management (cookies, middleware)
- Account linking by email is automatic when configured in Supabase

**Alternatives considered:**
- Manual OAuth with token exchange: Rejected — reinvents what Supabase provides
- Third-party auth library (NextAuth.js): Rejected — adds complexity, Supabase already does this

### 2. Invite Code Enforcement for Social Signups

**Decision:** Enforce invite codes for social login signups using a two-step flow: OAuth first, then invite code check.

**Flow:**
1. User taps "Sign in with Google"
2. OAuth completes → Supabase creates user in `auth.users`
3. App checks if this is a new user (no existing profile in `user_profiles`)
4. If new user → redirect to invite code screen before allowing access
5. If valid invite code → mark invite as used, allow access
6. If no valid invite code → sign out the user, delete the `auth.users` row (cleanup)

**Why not check invite before OAuth?**
- OAuth is a redirect flow — we can't inject a step before the redirect
- Supabase creates the user during OAuth callback, before our code runs
- Post-OAuth invite check is the only practical approach

**Rationale:**
- Preserves invite-first model without hacking the OAuth flow
- Clean UX: OAuth → invite code → done (only for first-time users)
- Returning users skip the invite code step entirely

**Alternatives considered:**
- Pre-OAuth invite code: Rejected — not possible with redirect-based OAuth
- Allowlist of emails: Rejected — doesn't scale, defeats purpose of invite codes
- Disable Supabase auto-confirm for OAuth: Rejected — makes flow complex

### 3. Account Linking Strategy

**Decision:** Enable automatic account linking by email in Supabase Auth settings.

**Behavior:**
- User signs up with email `bart@example.com` (password)
- Later logs in with Google using same email
- Supabase links both identities to the same `auth.users` row
- Same user ID, same profile, same recipes

**Configuration:** In Supabase Dashboard → Authentication → Settings:
- Enable "Automatic Linking" for matching email addresses

**Rationale:**
- Prevents duplicate accounts
- Seamless for users who try different login methods
- No custom code needed

### 4. Profile Trigger Update

**Decision:** Update `handle_new_user()` trigger to prefer OAuth display name over email-derived name.

**Updated logic:**
```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, display_name, avatar_url, is_private)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',      -- Google/Apple display name
      new.raw_user_meta_data->>'name',            -- fallback
      split_part(new.email, '@', 1)               -- email prefix fallback
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',      -- Google profile picture
      new.raw_user_meta_data->>'picture'           -- alternative key
    ),
    false
  );
  return new;
end;
$$ language plpgsql security definer;
```

**Rationale:**
- Google OAuth provides `full_name` and `avatar_url` in user metadata
- Apple OAuth provides `full_name` (first time only — Apple sends name only on first auth)
- Fallback chain ensures a display name is always set
- Avatar from Google means users get a profile picture for free

### 5. Mobile: Native Apple Sign-In + Web-Based Google Sign-In

**Decision:** Use native Apple Sign-In (`expo-apple-authentication`) on iOS and web-based OAuth for Google on mobile.

**Apple (iOS):**
```typescript
import * as AppleAuthentication from 'expo-apple-authentication'

const credential = await AppleAuthentication.signInAsync({
  requestedScopes: [
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ],
})

await supabase.auth.signInWithIdToken({
  provider: 'apple',
  token: credential.identityToken,
})
```

**Google (mobile):**
- Use `expo-auth-session` with Supabase's Google OAuth endpoint
- Or use `@react-native-google-signin/google-signin` for native Google Sign-In
- Exchange the id_token with Supabase via `signInWithIdToken`

**Rationale:**
- Native Apple Sign-In is required by App Store guidelines
- Native Google Sign-In provides better UX than web redirect on mobile
- Both use `signInWithIdToken` to exchange provider tokens with Supabase

### 6. Login UI Layout

**Decision:** Social login buttons above email/password form, separated by a divider.

**Layout:**
```
[Sign in with Google]
[Sign in with Apple]
────── or ──────
[Email field]
[Password field]
[Sign In button]
```

**Rationale:**
- Social login first = lowest friction path is most prominent
- "or" divider is a standard pattern users recognize
- Email/password still available for users who prefer it
- Apple button uses Apple's required design guidelines (black button, SF Symbol)

## Risks / Trade-offs

### [Risk] Apple sends user name only on first authorization
**Mitigation:** Cache the name in the trigger from `raw_user_meta_data` on first signup. If missed, user can edit their display name in profile settings. This is a known Apple quirk — all apps deal with it.

### [Risk] OAuth redirect URLs must be configured correctly per environment
**Mitigation:** Configure separate redirect URLs for:
- Local dev: `http://localhost:3000/auth/callback`
- Production: `https://eefeats.com/auth/callback`
- Mobile: deep link scheme `eefeats://auth/callback`
Document all required URLs in setup instructions.

### [Risk] Post-OAuth invite code check could leave orphan auth.users rows
**Mitigation:** If a new user fails the invite code check, sign them out and optionally delete the auth.users row via admin API. Or leave the row — it's harmless, and they can try again with a valid code.

### [Trade-off] Two-step flow for first-time social signups
**Accepted:** First-time social login users see: OAuth → invite code screen → app. This is one extra screen but preserves the invite-first model. Returning users just tap and are in.

### [Trade-off] Apple Developer Account required
**Accepted:** Sign in with Apple requires a paid Apple Developer Account ($99/year). Already needed for App Store distribution.

## Migration Plan

**Phase 1: Backend Configuration**
1. Configure Google OAuth in Google Cloud Console
2. Configure Apple Sign-In in Apple Developer Account
3. Enable both providers in Supabase Dashboard
4. Enable automatic account linking
5. Update `handle_new_user()` trigger for OAuth metadata

**Phase 2: Web**
1. Add OAuth callback route
2. Update login page with social login buttons
3. Add post-OAuth invite code check for new users

**Phase 3: Mobile**
1. Add native Apple Sign-In
2. Add Google Sign-In
3. Update login screen with social login buttons
4. Handle deep link callbacks
5. Add post-OAuth invite code check

**Rollback:**
- Disable providers in Supabase Dashboard (instant)
- Remove social login buttons from UI
- Existing email/password users completely unaffected
