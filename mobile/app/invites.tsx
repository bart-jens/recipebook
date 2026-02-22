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
import { colors, spacing, fontFamily, typography } from '@/lib/theme';
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
            placeholderTextColor={colors.inkMuted}
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
          <ActivityIndicator style={styles.loader} color={colors.accent} />
        ) : invites.length > 0 ? (
          <FlatList
            data={invites}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Your invites</Text>
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
                <Text style={[
                  styles.statusText,
                  item.used_at ? styles.statusTextJoined : styles.statusTextPending,
                ]}>
                  {item.used_at ? 'Joined' : 'Pending'}
                </Text>
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
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  subtitle: { fontFamily: fontFamily.sans, fontSize: 14, lineHeight: 21, color: colors.inkSecondary },

  formRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'flex-end',
  },
  emailInput: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: 10,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.ink,
  },

  successCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.oliveLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  successText: { fontFamily: fontFamily.sans, fontSize: 13, color: colors.olive },
  codeText: {
    ...typography.subheading,
    color: colors.olive,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  shareButton: {
    marginTop: spacing.md,
    backgroundColor: colors.olive,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  shareButtonText: { ...typography.metaSmall, color: colors.white },

  loader: { marginTop: spacing.xxl },
  listContent: { paddingHorizontal: spacing.xl },
  separator: { height: spacing.sm },
  sectionTitle: {
    ...typography.meta,
    color: colors.inkSecondary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },

  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.lg,
  },
  inviteInfo: { flex: 1 },
  inviteEmail: { fontFamily: fontFamily.sans, fontSize: 14, fontWeight: '500', color: colors.ink },
  inviteCode: { ...typography.meta, color: colors.inkMuted, marginTop: 2 },

  statusText: {
    ...typography.meta,
  },
  statusTextJoined: {
    color: colors.olive,
  },
  statusTextPending: {
    color: colors.inkMuted,
  },

  emptyText: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
