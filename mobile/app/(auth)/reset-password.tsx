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
