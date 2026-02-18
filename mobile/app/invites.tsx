import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radii } from '@/lib/theme';
import Button from '@/components/ui/Button';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

interface Invite {
  id: string;
  email: string;
  code: string;
  used_at: string | null;
  created_at: string;
}

export default function InvitesScreen() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/invites`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Cookie': `sb-access-token=${session?.access_token || ''}; sb-refresh-token=${session?.refresh_token || ''}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setInvites(data.invites || []);
      }
    } catch {
      // Silently fail on load
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInvites();
    }, [fetchInvites])
  );

  const handleCreate = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter an email address');
      return;
    }

    setCreating(true);
    setLastCode(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Cookie': `sb-access-token=${session?.access_token || ''}; sb-refresh-token=${session?.refresh_token || ''}`,
        },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Could not create invite');
        setCreating(false);
        return;
      }

      setLastCode(data.code);
      setEmail('');
      fetchInvites();
    } catch {
      Alert.alert('Error', 'Could not connect to server');
    }

    setCreating(false);
  };

  const shareCode = async (code: string, inviteEmail: string) => {
    try {
      await Share.share({
        message: `You're invited to EefEats! Use this code to sign up: ${code}`,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Invite Friends' }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            EefEats is invite-only. Share codes with friends to let them join.
          </Text>
        </View>

        <View style={styles.formRow}>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="friend@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <Button
            title={creating ? '...' : 'Invite'}
            variant="primary"
            size="sm"
            onPress={handleCreate}
            disabled={creating || !email.trim()}
            loading={creating}
          />
        </View>

        {lastCode && (
          <View style={styles.successCard}>
            <Text style={styles.successText}>Invite created! Share this code:</Text>
            <Text style={styles.codeText}>{lastCode}</Text>
            <TouchableOpacity
              onPress={() => shareCode(lastCode, '')}
              activeOpacity={0.7}
              style={styles.shareButton}
            >
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : invites.length > 0 ? (
          <FlatList
            data={invites}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Your Invites</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.inviteCard}
                activeOpacity={0.7}
                onPress={() => !item.used_at && shareCode(item.code, item.email)}
              >
                <View style={styles.inviteInfo}>
                  <Text style={styles.inviteEmail}>{item.email}</Text>
                  <Text style={styles.inviteCode}>{item.code}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  item.used_at ? styles.statusBadgeJoined : styles.statusBadgePending,
                ]}>
                  <Text style={[
                    styles.statusText,
                    item.used_at ? styles.statusTextJoined : styles.statusTextPending,
                  ]}>
                    {item.used_at ? 'Joined' : 'Pending'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.emptyText}>No invites sent yet.</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  subtitle: { ...typography.body, color: colors.textSecondary },

  formRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  emailInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },

  successCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.successBg,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  successText: { ...typography.bodySmall, color: colors.success },
  codeText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  shareButton: {
    marginTop: spacing.md,
    backgroundColor: colors.success,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  shareButtonText: { color: colors.white, fontWeight: '600', ...typography.bodySmall },

  loader: { marginTop: spacing.xxl },
  listContent: { paddingHorizontal: spacing.xl },
  separator: { height: spacing.sm },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
  },

  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  inviteInfo: { flex: 1 },
  inviteEmail: { ...typography.bodySmall, fontWeight: '500', color: colors.text },
  inviteCode: { ...typography.caption, color: colors.textMuted, marginTop: 2, fontFamily: 'monospace' },

  statusBadge: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusBadgeJoined: {
    backgroundColor: colors.successBg,
  },
  statusBadgePending: {
    backgroundColor: colors.surface,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '500',
  },
  statusTextJoined: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.textSecondary,
  },

  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
