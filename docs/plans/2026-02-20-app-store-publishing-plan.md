# App Store Publishing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Get the EefEats iOS app published on the Apple App Store with all mandatory requirements met.

**Architecture:** Lean launch — free tier only, open signups, no IAP. All server-side logic via Next.js API routes (no Supabase Edge Functions). Account deletion via admin API. Legal pages hosted on eefeats.com, linked from within the app.

**Tech Stack:** Expo 54 (managed workflow), EAS Build, Supabase Auth (admin API for deletion), Next.js API routes, React Native

**Prerequisites (manual, done by Bart):**
- [ ] Enroll in Apple Developer Program ($99/year) at developer.apple.com
- [ ] Once approved, register Bundle ID `com.eefeats.app` in Certificates, Identifiers & Profiles
- [ ] Create a Service ID for Sign in with Apple
- [ ] Generate a Sign in with Apple private key (.p8 file)
- [ ] Configure Apple as an OAuth provider in Supabase Dashboard (Auth > Providers > Apple)
- [ ] Prepare App Store icon: 1024x1024 PNG, no alpha channel, no rounded corners (Apple adds them)

---

### Task 1: Fix app.json — rename app and configure iOS

**Files:**
- Modify: `mobile/app.json`

**Step 1: Update app.json**

Change `name`, `slug`, `scheme`, and add iOS configuration:

```json
{
  "expo": {
    "name": "EefEats",
    "slug": "eefeats",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "eefeats",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.eefeats.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "EefEats uses the camera to scan recipes from photos.",
        "NSPhotoLibraryUsageDescription": "EefEats accesses your photo library to import recipe photos and set your profile picture."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#2D5F5D"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-apple-authentication"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Step 2: Verify the app still starts**

Run: `cd mobile && npx expo start --ios`
Expected: App launches with no errors. Title in Expo should show "EefEats".

**Step 3: Commit**

```bash
git add mobile/app.json
git commit -m "chore: rename app to EefEats, add iOS bundle ID and infoPlist"
```

---

### Task 2: Create EAS Build configuration

**Files:**
- Create: `mobile/eas.json`

**Step 1: Install EAS CLI (if not already)**

Run: `npm install -g eas-cli`

**Step 2: Create eas.json**

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "BART_APPLE_ID_HERE",
        "ascAppId": "APP_STORE_CONNECT_APP_ID_HERE",
        "appleTeamId": "TEAM_ID_HERE"
      }
    }
  }
}
```

Note: `appleId`, `ascAppId`, and `appleTeamId` in the submit section must be filled in by Bart after Apple Developer enrollment is complete.

**Step 3: Log in to EAS and configure**

Run: `cd mobile && eas login`
Run: `eas build:configure` (if prompted, confirm iOS settings)

**Step 4: Test a development build**

Run: `cd mobile && eas build --platform ios --profile development`
Expected: Build queues successfully on EAS servers. First build takes time (certificates auto-generated).

**Step 5: Commit**

```bash
git add mobile/eas.json
git commit -m "chore: add EAS Build configuration for iOS"
```

---

### Task 3: Add cascade delete to recipes table

The `recipes` table has `created_by uuid not null references auth.users(id)` but **no** `on delete cascade` clause. All other user-referencing tables cascade. We need to fix this so deleting a user's auth record also deletes their recipes.

**Files:**
- Create: `supabase/migrations/20260220000001_add_cascade_delete_recipes.sql`

**Step 1: Write the migration**

```sql
-- Add ON DELETE CASCADE to recipes.created_by
-- This ensures all user recipes are deleted when their auth account is deleted

alter table public.recipes
  drop constraint recipes_created_by_fkey,
  add constraint recipes_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete cascade;
```

Note: Check the actual constraint name first. Run `\d recipes` in psql or check the original migration for the exact constraint name. It may be auto-generated as `recipes_created_by_fkey`.

**Step 2: Test migration locally**

Run: `cd /Users/bart/claude/together-map && npx supabase db reset`
Expected: Clean reset with no errors.

**Step 3: Commit**

```bash
git add supabase/migrations/20260220000001_add_cascade_delete_recipes.sql
git commit -m "fix: add cascade delete to recipes.created_by foreign key"
```

---

### Task 4: Create account deletion API route

**Files:**
- Create: `src/app/api/auth/delete-account/route.ts`
- Reference: `src/lib/supabase/admin.ts` (existing admin client)

**Step 1: Write the API route**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Delete user's storage (avatars, recipe images)
  const { data: avatarFiles } = await admin.storage
    .from("avatars")
    .list(user.id);
  if (avatarFiles?.length) {
    await admin.storage
      .from("avatars")
      .remove(avatarFiles.map((f) => `${user.id}/${f.name}`));
  }

  const { data: recipeFiles } = await admin.storage
    .from("recipe-images")
    .list(user.id);
  if (recipeFiles?.length) {
    await admin.storage
      .from("recipe-images")
      .remove(recipeFiles.map((f) => `${user.id}/${f.name}`));
  }

  // Delete auth user — cascades to all user data via foreign keys
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
```

**Step 2: Verify the admin client import works**

Read `src/lib/supabase/admin.ts` to confirm the export name. Adjust import if needed.

**Step 3: Commit**

```bash
git add src/app/api/auth/delete-account/route.ts
git commit -m "feat: add account deletion API route"
```

---

### Task 5: Add "Delete Account" UI to mobile profile

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx` (add delete button to actions section)
- Reference: `mobile/components/ui/Button.tsx` (existing component)

**Step 1: Add delete account handler and UI**

In `profile.tsx`, add a `handleDeleteAccount` function that:
1. Shows a two-step confirmation:
   - First `Alert.alert` with "Delete Account" / "This will permanently delete your account and all your recipes, ratings, and follows. This cannot be undone."
   - Second `Alert.alert` with "Are you absolutely sure?" / "Type your email to confirm" (or just a second confirmation)
2. Calls `DELETE /api/auth/delete-account` (via the Next.js web app URL)
3. On success, calls `signOut()` to clear local session

Add a "Delete Account" button in the `actions` View, below "Sign out":

```tsx
<Button
  title="Delete Account"
  variant="ghost"
  size="lg"
  textStyle={{ color: colors.danger }}
  onPress={handleDeleteAccount}
/>
```

**Step 2: Test the flow**

1. Open profile tab
2. Tap "Delete Account"
3. Confirm first dialog
4. Confirm second dialog
5. Verify: user is signed out, cannot sign back in with same credentials

**Step 3: Commit**

```bash
git add mobile/app/(tabs)/profile.tsx
git commit -m "feat: add delete account button to mobile profile"
```

---

### Task 6: Add "Delete Account" UI to web profile

**Files:**
- Modify: `src/app/(authenticated)/profile/page.tsx` OR `src/app/(authenticated)/profile/edit/page.tsx`

**Step 1: Add delete account section to the web edit profile page**

Add a "Danger Zone" section at the bottom of the edit profile page with:
- A "Delete Account" button (red/danger styled)
- Confirmation modal or dialog (two-step, same as mobile)
- Calls `DELETE /api/auth/delete-account`
- On success, redirects to login page

**Step 2: Test the flow**

Same verification as mobile.

**Step 3: Commit**

```bash
git add src/app/(authenticated)/profile/edit/page.tsx
git commit -m "feat: add delete account to web profile settings"
```

---

### Task 7: Open signups — make invite code optional

Currently, both web and mobile **require** an invite code to sign up. We need to make it optional while keeping the invite system alive for organic sharing.

**Files:**
- Modify: `src/app/api/auth/signup/route.ts` (API: make invite code optional)
- Modify: `src/app/signup/actions.ts` (web server action: make invite code optional)
- Modify: `src/app/signup/signup-form.tsx` (web UI: make invite field optional)
- Modify: `mobile/app/(auth)/signup.tsx` (mobile UI: make invite field optional)
- Modify: `mobile/contexts/auth.tsx` (mobile auth: make inviteCode param optional)

**Step 1: Update the API route**

In `src/app/api/auth/signup/route.ts`:
- If invite code is provided, validate it (same as before)
- If invite code is NOT provided, skip validation and create user directly
- Still mark invite as used if one was provided

**Step 2: Update the web server action**

In `src/app/signup/actions.ts`:
- Same logic: if code is provided, validate. If empty, skip.
- Update form validation to not require invite code.

**Step 3: Update web signup form**

In `src/app/signup/signup-form.tsx`:
- Make the invite code field optional (remove "required")
- Change subtitle from "Join with an invite code" to "Create your account"
- Add helper text like "Have an invite code? Enter it here" on the invite field
- Allow signup button when just email + password are filled

**Step 4: Update mobile signup screen**

In `mobile/app/(auth)/signup.tsx`:
- Remove the `if (!inviteCode || ...)` guard — only require email + password
- Make invite code field optional with placeholder "Invite code (optional)"
- Change subtitle from "Join with an invite code" to "Create your account"

**Step 5: Update mobile auth context**

In `mobile/contexts/auth.tsx`:
- Change `signUp(email, password, inviteCode)` to `signUp(email, password, inviteCode?)`
- Only include invite code in the API call body if it's provided

**Step 6: Test both platforms**

1. Sign up on web without invite code — should succeed
2. Sign up on mobile without invite code — should succeed
3. Sign up with a valid invite code — should succeed and mark code as used
4. Sign up with an invalid invite code — should fail with error message

**Step 7: Commit**

```bash
git add src/app/api/auth/signup/route.ts src/app/signup/actions.ts src/app/signup/signup-form.tsx mobile/app/(auth)/signup.tsx mobile/contexts/auth.tsx
git commit -m "feat: make invite code optional for open signups"
```

---

### Task 8: Enable Sign in with Apple

This task assumes Bart has completed the prerequisites: Apple Developer enrollment, Service ID, private key, and Supabase provider configuration.

**Files:**
- Modify: `mobile/app/(auth)/login.tsx` (add Apple sign-in button)
- Modify: `mobile/app/(auth)/signup.tsx` (add Apple sign-in button)
- Modify: `mobile/app.json` (already done in Task 1 — `expo-apple-authentication` plugin)
- Possibly modify: `mobile/contexts/auth.tsx` (verify `signInWithOAuth` works for Apple)
- Modify: `src/app/login/page.tsx` or `src/app/login/login-form.tsx` (web Apple sign-in)
- Modify: `src/app/signup/signup-form.tsx` (web Apple sign-in)

**Step 1: Install expo-apple-authentication**

Run: `cd mobile && npx expo install expo-apple-authentication`

**Step 2: Add Apple sign-in button to mobile login**

In `mobile/app/(auth)/login.tsx`, add below the email/password form:

```tsx
import * as AppleAuthentication from 'expo-apple-authentication';

// In the component, add a divider and Apple button after the sign-in button:
<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>or</Text>
  <View style={styles.dividerLine} />
</View>

<AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
  cornerRadius={radii.md}
  style={{ width: '100%', height: 48 }}
  onPress={handleAppleSignIn}
/>
```

The `handleAppleSignIn` function should use the existing `signInWithOAuth('apple')` from auth context, or use the native Apple Authentication flow directly with Supabase's `signInWithIdToken`.

**Step 3: Add same button to mobile signup screen**

Same pattern as login.

**Step 4: Add Apple sign-in to web login and signup**

On web, use Supabase's `signInWithOAuth({ provider: 'apple' })` which redirects to Apple's OAuth page.

**Step 5: Test on physical iOS device**

Apple Sign-In only works on real devices or TestFlight, not Expo Go.

Run: `cd mobile && eas build --platform ios --profile development`
Install dev build on device and test the flow.

**Step 6: Commit**

```bash
git add mobile/app/(auth)/login.tsx mobile/app/(auth)/signup.tsx mobile/contexts/auth.tsx mobile/package.json
git commit -m "feat: enable Sign in with Apple on mobile"
```

---

### Task 9: Create Privacy Policy and Terms of Service

**Files:**
- Create: `src/app/privacy/page.tsx` (public web page, no auth required)
- Create: `src/app/terms/page.tsx` (public web page, no auth required)

These are served from the Next.js web app so they're accessible at eefeats.com/privacy and eefeats.com/terms. Apple requires a URL, not an in-app-only document.

**Step 1: Write the Privacy Policy page**

Create a clean, readable page covering:
- What data we collect (email, display name, avatar, recipe content, cooking activity)
- How we use it (provide the service, show social features, improve the app)
- Third-party services (Supabase for auth/database, Vercel for hosting, Apple for Sign in with Apple)
- Data storage (Supabase hosted on AWS, data at rest encrypted)
- Data retention (kept while account is active, deleted on account deletion)
- User rights (access, correction, deletion via in-app "Delete Account")
- Children's privacy (not intended for under 13)
- Contact (email address for privacy inquiries)
- Effective date

**Step 2: Write the Terms of Service page**

Create a clean, readable page covering:
- Acceptance of terms
- Account responsibilities
- User-generated content (users own their content, grant EefEats a license to display it)
- Imported recipes (private by default, user's personal use, not redistributed)
- Acceptable use (no hate, spam, illegal content)
- Content moderation (EefEats may remove violating content)
- Account termination (user can delete anytime, EefEats can terminate for violations)
- Limitation of liability
- Changes to terms
- Governing law
- Contact information

**Step 3: Verify pages render**

Run: `cd /Users/bart/claude/together-map && npm run dev`
Visit: `http://localhost:3000/privacy` and `http://localhost:3000/terms`
Expected: Clean, readable legal pages.

**Step 4: Commit**

```bash
git add src/app/privacy/page.tsx src/app/terms/page.tsx
git commit -m "feat: add privacy policy and terms of service pages"
```

---

### Task 10: Add legal links to mobile app (in-app settings)

Apple reviewers check that privacy policy and terms are accessible from within the app.

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx` (add links in actions section)

**Step 1: Add legal links**

Add two buttons in the actions section of the profile screen, between "Send Feedback" and "Sign out":

```tsx
import * as WebBrowser from 'expo-web-browser';

<Button
  title="Privacy Policy"
  variant="ghost"
  size="lg"
  onPress={() => WebBrowser.openBrowserAsync('https://eefeats.com/privacy')}
/>
<Button
  title="Terms of Service"
  variant="ghost"
  size="lg"
  onPress={() => WebBrowser.openBrowserAsync('https://eefeats.com/terms')}
/>
```

**Step 2: Add legal links to web profile too**

Add links in the web profile or settings page footer.

**Step 3: Commit**

```bash
git add mobile/app/(tabs)/profile.tsx
git commit -m "feat: add privacy policy and terms links to mobile profile"
```

---

### Task 11: Configure Privacy Manifest

iOS 17+ requires apps to declare why they use certain APIs and what data they collect.

**Files:**
- Modify: `mobile/app.json` (add `ios.privacyManifests` section)

**Step 1: Add privacy manifest configuration**

In `app.json`, under `ios`, add:

```json
"privacyManifests": {
  "NSPrivacyAccessedAPITypes": [
    {
      "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
      "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
    }
  ],
  "NSPrivacyCollectedDataTypes": [
    {
      "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeEmailAddress",
      "NSPrivacyCollectedDataTypeLinked": true,
      "NSPrivacyCollectedDataTypeTracking": false,
      "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
    },
    {
      "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeName",
      "NSPrivacyCollectedDataTypeLinked": true,
      "NSPrivacyCollectedDataTypeTracking": false,
      "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
    },
    {
      "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePhotos",
      "NSPrivacyCollectedDataTypeLinked": true,
      "NSPrivacyCollectedDataTypeTracking": false,
      "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
    }
  ],
  "NSPrivacyTracking": false
}
```

Note: Verify exact API type reasons against Apple's documentation. The `CA92.1` reason for UserDefaults means "accessing user defaults to read and write values controlled by the app".

**Step 2: Commit**

```bash
git add mobile/app.json
git commit -m "chore: add iOS privacy manifest for App Store compliance"
```

---

### Task 12: App Store listing content

This is content creation, not code. Prepare the following for App Store Connect:

**Files:**
- Create: `docs/app-store-listing.md` (reference doc for listing content)

**Step 1: Write listing content**

```markdown
# EefEats — App Store Listing

**App Name:** EefEats
**Subtitle:** Your Social Recipe Book
**Category:** Food & Drink

**Description:**
EefEats is a recipe platform where you can save, organize, and share your favorite recipes.

Import recipes from any website or Instagram post, snap a photo of a cookbook page, or create your own from scratch. Organize your collection with tags, rate recipes as you cook them, and build your personal recipe book.

Follow friends and discover what they're cooking. Browse public recipes from other home cooks, fork and personalize them, and share your own creations with the community.

Features:
- Import recipes from URLs, Instagram, or photos
- Create and edit your own recipes
- Rate and log every time you cook
- Organize with tags and collections
- Follow friends and see their cooking activity
- Discover public recipes from other cooks
- Fork recipes and make them your own
- Private or public profile options
- Grocery list with per-ingredient adding

**Keywords:** recipes,cooking,recipe book,meal,food,social cooking,recipe organizer,recipe import,cookbook,fork recipe

**Support URL:** https://eefeats.com/support
**Privacy Policy URL:** https://eefeats.com/privacy

**Review Notes:**
Demo account: [provide test credentials]
The app requires an account to use. You can create a new account on the signup screen (no invite code required).
```

**Step 2: Commit**

```bash
git add docs/app-store-listing.md
git commit -m "docs: add App Store listing content"
```

---

### Task 13: TestFlight build and QA

This is the final step before submission.

**Step 1: Create a production build**

Run: `cd mobile && eas build --platform ios --profile production`
Expected: Build completes and is uploaded to App Store Connect.

**Step 2: Set up TestFlight**

1. Go to App Store Connect > My Apps > EefEats
2. The build should appear under TestFlight > iOS Builds
3. Add yourself and testers to Internal Testing group
4. Install via TestFlight app on iPhone

**Step 3: QA checklist**

Test every flow on a real device:

- [ ] Fresh signup (no invite code) — should work
- [ ] Fresh signup (with invite code) — should work
- [ ] Sign in with Apple — should work
- [ ] Email/password login — should work
- [ ] Onboarding (display name, username, avatar) — should work
- [ ] Create recipe manually — should work
- [ ] Import recipe from URL — should work
- [ ] Import recipe from Instagram — should work
- [ ] Import recipe from photo — should work
- [ ] Edit recipe — should work
- [ ] Delete recipe — should work
- [ ] Rate/log a cook — should work
- [ ] Browse discover tab — should work
- [ ] Follow a user — should work
- [ ] View a public profile — should work
- [ ] Edit own profile — should work
- [ ] Privacy toggle (public/private) — should work
- [ ] Privacy Policy link — opens in browser
- [ ] Terms of Service link — opens in browser
- [ ] Delete account — confirms, deletes, signs out
- [ ] Grocery list — add/check items
- [ ] Sign out — clears session
- [ ] Deep links / URL scheme — test `eefeats://` links
- [ ] No crashes, no blank screens, no placeholder content
- [ ] All text is readable, no truncation issues
- [ ] No broken images or missing icons

**Step 4: Fix any issues found**

Create follow-up commits for any bugs found during QA.

**Step 5: Submit for App Review**

1. In App Store Connect, fill in the App Information:
   - Name, subtitle, description, keywords (from Task 12)
   - Category: Food & Drink
   - Privacy Policy URL
   - Support URL
   - Screenshots (at minimum 6.7" and 6.5" sizes)
2. App Privacy: fill in the "nutrition labels" based on the privacy manifest
3. Upload screenshots
4. Select the TestFlight build
5. Add review notes (demo account credentials)
6. Submit for review

Expected: Review takes 24-48 hours. Be prepared for feedback/rejection on first submission.

---

## Task Dependency Order

```
Task 1 (app.json) ──────────────────────────────────────┐
Task 2 (eas.json) ──────────────────────────────────────┤
Task 3 (cascade migration) ─── Task 4 (delete API) ─── Task 5 (mobile delete UI) ──┤
                                                    └── Task 6 (web delete UI) ─────┤
Task 7 (open signups) ─────────────────────────────────────────────────────────────┤
Task 8 (Sign in with Apple) — depends on Bart's prerequisites ─────────────────────┤
Task 9 (legal pages) ─── Task 10 (in-app legal links) ────────────────────────────┤
Task 11 (privacy manifest) ────────────────────────────────────────────────────────┤
Task 12 (listing content) ─────────────────────────────────────────────────────────┤
                                                                                    ▼
                                                                    Task 13 (TestFlight + QA + Submit)
```

Tasks 1-2, 7, 8, 9, 11, 12 can all be done in parallel. Task 3 must precede 4, which must precede 5-6. Task 9 must precede 10. Everything must be done before Task 13.
