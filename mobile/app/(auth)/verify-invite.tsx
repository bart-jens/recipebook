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
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, fontFamily } from '@/lib/theme';
import { Logo } from '@/components/ui/Logo';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export default function VerifyInviteScreen() {
  const { clearInviteVerification, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter your invite code');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/auth/verify-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Invalid invite code');
        setLoading(false);
        return;
      }
      clearInviteVerification();
    } catch {
      setError('Could not connect to server');
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    await signOut();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Logo height={40} />
        <Text style={styles.heading}>One more step</Text>
        <Text style={styles.subtitle}>
          EefEats is invite-only. Enter your invite code to continue.
        </Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Invite code</Text>
            <TextInput
              style={styles.input}
              placeholder="XXXXXXXX"
              placeholderTextColor={colors.inkMuted}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel and sign out</Text>
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
  heading: {
    marginTop: spacing.xl,
    ...typography.heading,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.sm,
    ...typography.meta,
    color: colors.inkMuted,
    textAlign: 'center',
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
    letterSpacing: 2,
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
  cancelButton: {
    marginTop: spacing.xxl,
  },
  cancelText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
});
