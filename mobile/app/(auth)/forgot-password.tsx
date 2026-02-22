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
