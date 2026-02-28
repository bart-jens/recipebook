import { useEffect, useState } from 'react';
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
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';
import { Logo } from '@/components/ui/Logo';

export default function LoginScreen() {
  const { signIn, signInWithApple, signInWithOAuth, needsInviteVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (needsInviteVerification) {
      router.replace('/(auth)/verify-invite');
    }
  }, [needsInviteVerification]);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const { error } = await signInWithOAuth('google');
    if (error) {
      setError(error);
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setLoading(true);
    setError(null);
    const { error } = await signInWithApple();
    if (error) {
      setError(error);
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Logo height={40} />
        <Text style={styles.subtitle}>Sign in to your recipe collection</Text>

        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={0}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

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
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.inkMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.linkText}>
            Have an invite code? <Text style={styles.linkAccent}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function GoogleIcon() {
  // SVG rendered as inline paths via react-native-svg would be ideal,
  // but for simplicity we use a text placeholder styled consistently
  return (
    <View style={styles.googleIcon}>
      <Text style={styles.googleIconText}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  form: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.meta,
    color: colors.inkSecondary,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fontFamily.sans,
    color: colors.ink,
  },
  error: {
    ...typography.bodySmall,
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.metaSmall,
    color: colors.white,
  },
  linkText: {
    marginTop: spacing.xxl,
    ...typography.bodySmall,
    color: colors.inkSecondary,
  },
  linkAccent: {
    color: colors.accent,
    fontFamily: fontFamily.sans,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -spacing.md,
  },
  forgotText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  socialButtons: {
    width: '100%',
    marginTop: 40,
    gap: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingVertical: 12,
    height: 44,
  },
  googleButtonText: {
    ...typography.metaSmall,
    color: colors.ink,
  },
  googleIcon: {
    width: 18,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 11,
    fontFamily: fontFamily.sans,
    color: colors.white,
    fontWeight: '700',
  },
  appleButton: {
    width: '100%',
    height: 44,
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
});
