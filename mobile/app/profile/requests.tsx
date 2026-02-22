import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography } from '@/lib/theme';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

interface FollowRequest {
  id: string;
  requester_id: string;
  created_at: string;
  requester: {
    display_name: string;
    avatar_url: string | null;
  };
}

export default function FollowRequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      async function load() {
        const { data } = await supabase
          .from('follow_requests')
          .select('id, requester_id, created_at, requester:user_profiles!follow_requests_requester_id_fkey(display_name, avatar_url)')
          .eq('target_id', user!.id)
          .order('created_at', { ascending: false });

        setRequests(
          (data || []).map((r: any) => ({
            ...r,
            requester: Array.isArray(r.requester) ? r.requester[0] : r.requester,
          }))
        );
        setLoading(false);
      }

      load();
    }, [user])
  );

  const handleApprove = async (request: FollowRequest) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      // Insert follow relationship
      const { error: followError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: request.requester_id,
          following_id: user!.id,
        });

      if (followError) throw followError;

      // Delete the request
      await supabase
        .from('follow_requests')
        .delete()
        .eq('id', request.id);

      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      console.error('Approve failed:', err);
      Alert.alert('Error', 'Could not approve this request. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleDeny = async (request: FollowRequest) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      await supabase
        .from('follow_requests')
        .delete()
        .eq('id', request.id);

      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      console.error('Deny failed:', err);
      Alert.alert('Error', 'Could not deny this request. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const renderRequest = ({ item }: { item: FollowRequest }) => {
    const isProcessing = processingIds.has(item.id);

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestInfo}>
          <Avatar
            name={item.requester?.display_name || '?'}
            size="md"
            imageUrl={item.requester?.avatar_url}
          />
          <Text style={styles.requestName} numberOfLines={1}>
            {item.requester?.display_name || 'Unknown user'}
          </Text>
        </View>
        <View style={styles.requestActions}>
          <Button
            title="Approve"
            onPress={() => handleApprove(item)}
            variant="primary"
            size="sm"
            disabled={isProcessing}
          />
          <Button
            title="Deny"
            onPress={() => handleDeny(item)}
            variant="ghost"
            size="sm"
            disabled={isProcessing}
          />
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Follow Requests' }} />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No pending requests</Text>
            <Text style={styles.emptyDescription}>
              When someone requests to follow you, it will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.xl },

  loadingText: {
    ...typography.metaSmall,
    color: colors.inkSecondary,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    textAlign: 'center',
  },

  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  requestName: {
    ...typography.label,
    color: colors.ink,
    marginLeft: spacing.md,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
