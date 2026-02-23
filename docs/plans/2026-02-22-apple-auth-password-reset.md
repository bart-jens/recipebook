# Apple Auth & Password Reset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix privacy manifest duplicates, add Sign in with Apple, and add a full in-app password reset flow before App Store submission.

**Architecture:** SIWA uses `expo-apple-authentication` → `supabase.auth.signInWithIdToken` with a SHA256-hashed nonce (requires `expo-crypto`). Password reset uses Supabase email flow with `redirectTo: 'eefeats://reset-password'` — a deep link that the app catches, exchanges for a session, and routes to a new-password screen. All new auth methods are added to `contexts/auth.tsx`; UI changes are limited to login, two new auth screens, and `_layout.tsx`.

**Tech Stack:** expo-apple-authentication ~8.0.8 (already installed), expo-crypto (new install), expo-linking ~8.0.11, @supabase/supabase-js ^2.95.3, Expo Router, React Native

---

### Task 1: Fix duplicate privacy manifest entries

**Files:**
- Modify: `mobile/app.json`

The current `app.json` has:
- `NSPrivacyAccessedAPITypes`: `NSPrivacyAccessedAPICategoryUserDefaults` listed twice
- `NSPrivacyCollectedDataTypes`: `EmailAddress`, `Name`, `Photos` each listed twice

**Step 1: Deduplicate the privacy manifest**

Replace the `ios.privacyManifests` block in `mobile/app.json` with:

```json
"privacyManifests": {
  "NSPrivacyTracking": false,
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
  ]
}
```

**Step 2: Verify no duplicates remain**

Scan the full `ios` block and confirm each key appears exactly once.

**Step 3: Commit**

```bash
git add mobile/app.json
git commit -m "fix: deduplicate privacy manifest entries in app.json"
```

---

### Task 2: Install expo-crypto

`expo-apple-authentication` requires a cryptographically secure nonce for SIWA. `expo-crypto` provides `randomUUID()` and `digestStringAsync()`.

**Files:**
- Modify: `mobile/package.json` (via install command)

**Step 1: Install**

```bash
cd mobile && npx expo install expo-crypto
```

**Step 2: Verify it installed**

```bash
grep "expo-crypto" mobile/package.json
```

Expected: a line like `"expo-crypto": "~13.x.x"`

**Step 3: Commit**

```bash
git add mobile/package.json mobile/package-lock.json
git commit -m "chore: add expo-crypto for SIWA nonce"
```

---

### Task 3: Extend auth context

Add `signInWithApple`, `resetPassword`, `updatePassword`, `isPasswordReset`, and `clearPasswordReset` to `contexts/auth.tsx`.

**Files:**
- Modify: `mobile/contexts/auth.tsx`

**Step 1: Add imports at the top of `mobile/contexts/auth.tsx`**

After the existing imports, add:

```tsx
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
```

**Step 2: Extend `AuthContextType` interface**

Add these to the interface (after `signInWithOAuth`):

```tsx
signInWithApple: () => Promise<{ error: string | null }>;
resetPassword: (email: string) => Promise<{ error: string | null }>;
updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
isPasswordReset: boolean;
clearPasswordReset: () => void;
```

**Step 3: Add `isPasswordReset` state inside `AuthProvider`**

After the existing `useState` declarations:

```tsx
const [isPasswordReset, setIsPasswordReset] = useState(false);
```

**Step 4: Handle `PASSWORD_RESET` in `onAuthStateChange`**

Change the existing `onAuthStateChange` handler from:

```tsx
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);
});
```

to:

```tsx
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);
  if (event === 'PASSWORD_RESET') {
    setIsPasswordReset(true);
  }
});
```

**Step 5: Add `signInWithApple` function** (after `signInWithOAuth`):

```tsx
async function signInWithApple() {
  try {
    const nonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
    );
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
      nonce,
    });
    if (error) return { error: error.message };
    return { error: null };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return { error: null }; // User cancelled — not an error
    }
    return { error: e.message || 'Sign in with Apple failed' };
  }
}
```

**Step 6: Add `resetPassword` function** (after `signInWithApple`):

```tsx
async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'eefeats://reset-password',
  });
  return { error: error?.message || null };
}
```

**Step 7: Add `updatePassword` function** (after `resetPassword`):

```tsx
async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message || null };
}
```

**Step 8: Add `clearPasswordReset` function** (after `updatePassword`):

```tsx
function clearPasswordReset() {
  setIsPasswordReset(false);
}
```

**Step 9: Add new values to the context provider value object**

In the `<AuthContext.Provider value={{ ... }}>`, add:

```tsx
signInWithApple,
resetPassword,
updatePassword,
isPasswordReset,
clearPasswordReset,
```

**Step 10: Update the default context value** (the `createContext` call at top) to add matching no-ops:

```tsx
signInWithApple: async () => ({ error: null }),
resetPassword: async () => ({ error: null }),
updatePassword: async () => ({ error: null }),
isPasswordReset: false,
clearPasswordReset: () => {},
```

**Step 11: Commit**

```bash
git add mobile/contexts/auth.tsx
git commit -m "feat: add signInWithApple, resetPassword, updatePassword to auth context"
```

---

### Task 4: Add deep link handler to root layout

When the password reset email link is tapped, iOS opens `eefeats://reset-password#access_token=...&refresh_token=...&type=recovery`. We need to parse this URL, set the Supabase session, which triggers `PASSWORD_RESET` in `onAuthStateChange`, which sets `isPasswordReset: true`, which triggers navigation.

**Files:**
- Modify: `mobile/app/_layout.tsx`

**Step 1: Add imports**

At the top of `_layout.tsx`, add:

```tsx
import { useEffect } from 'react'; // already present
import { Linking } from 'react-native';
import { router } from 'expo-router'; // already present
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
```

**Step 2: Create a `DeepLinkHandler` component** inside the file (above `RootLayout`):

```tsx
function DeepLinkHandler() {
  const { isPasswordReset, clearPasswordReset } = useAuth();

  useEffect(() => {
    function handleUrl(url: string) {
      if (!url.includes('reset-password')) return;
      const fragment = url.split('#')[1];
      if (!fragment) return;
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isPasswordReset) {
      router.push('/(auth)/reset-password');
    }
  }, [isPasswordReset]);

  return null;
}
```

**Step 3: Mount `DeepLinkHandler` inside `AuthProvider`**

In the `RootLayout` return, add `<DeepLinkHandler />` as a sibling of `<Stack>`, inside `<AuthProvider>`:

```tsx
return (
  <AuthProvider>
    <DeepLinkHandler />
    <Stack screenOptions={{ headerShown: false }}>
      {/* existing screens */}
    </Stack>
  </AuthProvider>
);
```

**Step 4: Commit**

```bash
git add mobile/app/_layout.tsx
git commit -m "feat: add deep link handler for password reset flow"
```

---

### Task 5: Update login screen

Add Sign in with Apple button and "Forgot password?" link.

**Files:**
- Modify: `mobile/app/(auth)/login.tsx`

**Step 1: Add imports**

```tsx
import * as AppleAuthentication from 'expo-apple-authentication';
```

Also add `router` import from `expo-router` if not already present:
```tsx
import { router } from 'expo-router';
```

**Step 2: Add `handleAppleSignIn` handler** inside the component (after `handleLogin`):

```tsx
async function handleAppleSignIn() {
  setLoading(true);
  setError(null);
  const { error } = await signInWithApple();
  if (error) {
    setError(error);
    setLoading(false);
  }
}
```

Get `signInWithApple` from `useAuth()` — update the destructure line.

**Step 3: Add the "Forgot password?" link** inside the `<View style={styles.form}>`, after the Sign in button:

```tsx
<TouchableOpacity
  style={styles.forgotButton}
  onPress={() => router.push('/(auth)/forgot-password')}
>
  <Text style={styles.forgotText}>Forgot password?</Text>
</TouchableOpacity>
```

**Step 4: Add the Sign in with Apple button** after the form View, before the "Don't have an account?" link:

```tsx
<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>or</Text>
  <View style={styles.dividerLine} />
</View>

<AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
  cornerRadius={0}
  style={styles.appleButton}
  onPress={handleAppleSignIn}
/>
```

**Step 5: Add styles**

```tsx
forgotButton: {
  alignSelf: 'flex-end',
  marginTop: -spacing.md,
},
forgotText: {
  ...typography.metaSmall,
  color: colors.inkMuted,
},
divider: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: spacing.xl,
  gap: spacing.sm,
},
dividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: colors.border,
},
dividerText: {
  ...typography.metaSmall,
  color: colors.inkMuted,
},
appleButton: {
  width: '100%',
  height: 44,
  marginTop: spacing.md,
},
```

**Step 6: Commit**

```bash
git add mobile/app/(auth)/login.tsx
git commit -m "feat: add Sign in with Apple and forgot password link to login screen"
```

---

### Task 6: Create forgot-password screen

**Files:**
- Create: `mobile/app/(auth)/forgot-password.tsx`

**Step 1: Create the screen**

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';
import { Logo } from '@/components/ui/Logo';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email) return;
    setLoading(true);
    setError(null);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Logo height={40} />

        {sent ? (
          <View style={styles.successBlock}>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successBody}>
              We sent a password reset link to {email}. Open it on your phone to set a new password.
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backLink}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>Reset your password</Text>
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.inkMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              {error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity
                style={[styles.button, (!email || loading) && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={!email || loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Send reset link</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backLink}>Back to sign in</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.md,
    ...typography.meta,
    color: colors.inkMuted,
  },
  form: { width: '100%', marginTop: 40, gap: spacing.xl },
  field: { gap: spacing.sm },
  label: { ...typography.meta, color: colors.inkSecondary },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fontFamily.sans,
    color: colors.ink,
  },
  error: { ...typography.bodySmall, color: colors.danger },
  button: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { ...typography.metaSmall, color: colors.white },
  backLink: {
    marginTop: spacing.xxl,
    ...typography.bodySmall,
    color: colors.accent,
  },
  successBlock: {
    marginTop: 40,
    width: '100%',
    gap: spacing.lg,
    alignItems: 'center',
  },
  successTitle: { ...typography.subheading, color: colors.ink },
  successBody: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
});
```

**Step 2: Commit**

```bash
git add mobile/app/(auth)/forgot-password.tsx
git commit -m "feat: add forgot password screen"
```

---

### Task 7: Create reset-password screen

This screen is shown after the deep link opens the app. The user is already authenticated (session set by `DeepLinkHandler`), so `updatePassword` is available.

**Files:**
- Create: `mobile/app/(auth)/reset-password.tsx`

**Step 1: Create the screen**

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';
import { Logo } from '@/components/ui/Logo';

export default function ResetPasswordScreen() {
  const { updatePassword, clearPasswordReset } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      clearPasswordReset();
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Logo height={40} />
        <Text style={styles.subtitle}>Set a new password</Text>
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.inkMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoFocus
            />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={[styles.button, (!password || loading) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!password || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Update password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.md,
    ...typography.meta,
    color: colors.inkMuted,
  },
  form: { width: '100%', marginTop: 40, gap: spacing.xl },
  field: { gap: spacing.sm },
  label: { ...typography.meta, color: colors.inkSecondary },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fontFamily.sans,
    color: colors.ink,
  },
  error: { ...typography.bodySmall, color: colors.danger },
  button: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { ...typography.metaSmall, color: colors.white },
});
```

**Step 2: Commit**

```bash
git add mobile/app/(auth)/reset-password.tsx
git commit -m "feat: add reset password screen"
```

---

### Task 8: Add reset-password to auth layout redirect guard

The `(auth)/_layout.tsx` redirects authenticated users to `/(tabs)`. The reset-password screen needs to be reachable when the user has a session (they're authenticated via the recovery token), so we need to allow it through.

**Files:**
- Modify: `mobile/app/(auth)/_layout.tsx`

**Step 1: Modify the auth layout to allow reset-password through**

Replace the current redirect logic:

```tsx
if (session) {
  return <Redirect href="/(tabs)" />;
}
```

with:

```tsx
import { useSegments } from 'expo-router';

// inside component:
const segments = useSegments();
const isResetPassword = segments.includes('reset-password');

if (session && !isResetPassword) {
  return <Redirect href="/(tabs)" />;
}
```

Note: `useSegments` is already available from `expo-router`.

**Step 2: Commit**

```bash
git add mobile/app/(auth)/_layout.tsx
git commit -m "fix: allow reset-password screen when authenticated"
```

---

### Task 9: Verification

**Manual test plan — run against a production build (SIWA requires real device):**

**Privacy manifest:**
- [ ] Open `mobile/app.json`, confirm no duplicate keys in `NSPrivacyAccessedAPITypes` or `NSPrivacyCollectedDataTypes`

**Sign in with Apple:**
- [ ] Open login screen → confirm Apple button renders below the "or" divider
- [ ] Tap Apple button → native Apple sheet appears
- [ ] Complete Apple auth → lands on home tab
- [ ] Tap Apple button → cancel → no error shown, stays on login screen
- [ ] Restart app → still logged in (session persisted)

**Forgot password:**
- [ ] Tap "Forgot password?" on login screen → forgot-password screen opens
- [ ] Submit with empty email → button is disabled, no submit
- [ ] Submit with valid email → success message shown with the email address
- [ ] Tap "Back to sign in" → returns to login screen
- [ ] Check email inbox → reset email received with a link

**Password reset deep link (requires production build or TestFlight):**
- [ ] Tap reset link in email on the same device → app opens at reset-password screen
- [ ] Submit with password < 6 chars → error shown
- [ ] Submit valid password → navigates to home tab
- [ ] Sign out → sign in with old password → fails
- [ ] Sign in with new password → succeeds

**Auth layout guard:**
- [ ] Logged-in user cannot navigate to `/(auth)/login` (redirected to tabs)
- [ ] Logged-in user can reach `/(auth)/reset-password` after tapping reset link

---

### Task 10: Build and submit

```bash
cd mobile
eas build --platform ios --profile production
```

Once build completes:

```bash
eas submit --platform ios --profile production
```

Verify in App Store Connect that the build appears under TestFlight before submitting for review.
