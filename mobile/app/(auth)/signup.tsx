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
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { Logo } from '@/components/ui/Logo';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signUp(email, password, inviteCode || undefined);
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
        <Text style={styles.subtitle}>CREATE YOUR ACCOUNT</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>INVITE CODE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="ABCD1234"
              placeholderTextColor={colors.inkMuted}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
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
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.inkMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <Text style={styles.legalText}>
            By signing up, you agree to our{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL(`${API_BASE}/terms`)}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL(`${API_BASE}/privacy`)}
            >
              Privacy Policy
            </Text>
            .
          </Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>SIGN UP</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkAccent}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.inkMuted,
  },
  form: {
    width: '100%',
    marginTop: 40,
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 1.4,
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
  codeInput: {
    fontFamily: fontFamily.mono,
    letterSpacing: 2,
    textAlign: 'center',
  },
  error: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
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
    color: colors.white,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  legalText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legalLink: {
    color: colors.primary,
  },
  linkText: {
    marginTop: spacing.xxl,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  linkAccent: {
    color: colors.accent,
    fontFamily: fontFamily.sansMedium,
  },
});
