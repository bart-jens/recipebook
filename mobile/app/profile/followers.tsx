import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography } from '@/lib/theme';
import Avatar from '@/components/ui/Avatar';

interface Follower {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function FollowersScreen() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      async function load() {
        const { data: follows } = await supabase
          .from('user_follows')
          .select('follower_id, created_at')
          .eq('following_id', user!.id)
          .order('created_at', { ascending: false });

        const followerIds = (follows || []).map((f) => f.follower_id);

        if (followerIds.length === 0) {
          setFollowers([]);
          setLoading(false);
          return;
        }

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, avatar_url')
          .in('id', followerIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        const ordered = followerIds
          .map((id) => profileMap.get(id))
          .filter(Boolean) as Follower[];

        setFollowers(ordered);
        setLoading(false);
      }

      load();
    }, [user])
  );

  const renderFollower = ({ item }: { item: Follower }) => (
    <TouchableOpacity
      style={styles.followerCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      <Avatar
        name={item.display_name || '?'}
        size="md"
        imageUrl={item.avatar_url}
      />
      <Text style={styles.followerName} numberOfLines={1}>
        {item.display_name || 'Unknown user'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Followers' }} />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : followers.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No followers yet</Text>
            <Text style={styles.emptyDescription}>
              Invite friends to join EefEats!
            </Text>
            <TouchableOpacity
              style={styles.inviteButton}
              activeOpacity={0.7}
              onPress={() => router.push('/invites')}
            >
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={followers}
            renderItem={renderFollower}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              <Text style={styles.count}>
                {followers.length} follower{followers.length !== 1 ? 's' : ''}
              </Text>
            }
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
  count: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginBottom: spacing.md,
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

  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  followerName: {
    ...typography.label,
    color: colors.ink,
    marginLeft: spacing.md,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  inviteButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteButtonText: {
    ...typography.label,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
});
