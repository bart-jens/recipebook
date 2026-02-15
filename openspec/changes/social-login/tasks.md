## 1. Backend: OAuth Provider Configuration

- [ ] 1.1 Create Google OAuth 2.0 credentials in Google Cloud Console (client ID + secret, authorized redirect URIs for localhost + production + mobile deep link)
- [ ] 1.2 Configure Sign in with Apple in Apple Developer Account (Service ID, key file, redirect URIs)
- [ ] 1.3 Enable Google provider in Supabase Dashboard → Authentication → Providers, add client ID + secret
- [ ] 1.4 Enable Apple provider in Supabase Dashboard → Authentication → Providers, add Service ID + key
- [ ] 1.5 Enable automatic account linking by email in Supabase Dashboard → Authentication → Settings

## 2. Backend: Profile Trigger Update

- [ ] 2.1 Update `handle_new_user()` trigger to use OAuth metadata: prefer `raw_user_meta_data->>'full_name'` or `->>'name'` for display_name, use `->>'avatar_url'` or `->>'picture'` for avatar_url, fall back to email prefix

## 3. Web: OAuth Callback Route

- [ ] 3.1 Create `/auth/callback` route that exchanges the OAuth code for a session using Supabase server client
- [ ] 3.2 After session creation, check if user has an existing profile in `user_profiles`. If no profile exists, redirect to invite code screen. If profile exists, redirect to main app.

## 4. Web: Login Page Update

- [ ] 4.1 Add "Sign in with Google" button above email form (Google branding guidelines: white background, Google logo, standard text)
- [ ] 4.2 Add "Sign in with Apple" button (Apple HIG: black background, Apple logo, standard text)
- [ ] 4.3 Add "or" divider between social buttons and email/password form
- [ ] 4.4 Implement `signInWithOAuth({ provider: 'google' })` on Google button click with redirect to `/auth/callback`
- [ ] 4.5 Implement `signInWithOAuth({ provider: 'apple' })` on Apple button click with redirect to `/auth/callback`
- [ ] 4.6 Handle OAuth errors: display "Sign in failed. Please try again." on failure

## 5. Web: Post-OAuth Invite Code Flow

- [ ] 5.1 Create invite code screen shown after OAuth for new users (no existing profile). Input field for invite code, submit button.
- [ ] 5.2 On valid invite code: mark invite as used, allow navigation to main app (profile trigger will have already created the profile)
- [ ] 5.3 On invalid/missing invite code: sign the user out, redirect to login with message "You need a valid invite code to join."
- [ ] 5.4 Add `/auth/callback` to the list of unprotected routes in middleware

## 6. Mobile: Google Sign-In

- [ ] 6.1 Install and configure `@react-native-google-signin/google-signin` or `expo-auth-session` for Google OAuth
- [ ] 6.2 Implement Google Sign-In button on mobile login screen
- [ ] 6.3 Exchange Google id_token with Supabase via `signInWithIdToken({ provider: 'google', token })`

## 7. Mobile: Apple Sign-In

- [ ] 7.1 Install `expo-apple-authentication`
- [ ] 7.2 Implement native Apple Sign-In button on mobile login screen (iOS only, hide on Android)
- [ ] 7.3 On Apple auth success, exchange identity token with Supabase via `signInWithIdToken({ provider: 'apple', token })`
- [ ] 7.4 Capture Apple's full_name from first-time authorization response

## 8. Mobile: Login Screen Update

- [ ] 8.1 Add "Sign in with Google" and "Sign in with Apple" buttons above email/password form with "or" divider
- [ ] 8.2 Style buttons per platform branding guidelines (Apple HIG, Google branding)
- [ ] 8.3 Handle OAuth errors with alert: "Sign in failed. Please try again."

## 9. Mobile: Post-OAuth Invite Code Flow

- [ ] 9.1 After social login, check if user has existing profile. If new user, navigate to invite code screen.
- [ ] 9.2 On valid invite code: mark as used, navigate to main app.
- [ ] 9.3 On invalid/missing: sign out, return to login with error message.
