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
import { colors, spacing, typography, radii } from '@/lib/theme';
import Avatar from '@/components/ui/Avatar';

interface NewFollower {
  follower_id: string;
  display_name: string;
  avatar_url: string | null;
  followed_at: string;
}

export default function NewFollowersScreen() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<NewFollower[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      async function load() {
        // Fetch new followers BEFORE marking seen
        const { data } = await supabase.rpc('get_new_followers', {
          p_user_id: user!.id,
        });

        setFollowers((data as NewFollower[]) || []);
        setLoading(false);

        // Mark all followers as seen
        await supabase.rpc('mark_followers_seen');
      }

      load();
    }, [user])
  );

  const renderFollower = ({ item }: { item: NewFollower }) => (
    <TouchableOpacity
      style={styles.followerCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/profile/${item.follower_id}`)}
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
      <Stack.Screen options={{ headerTitle: 'New Followers' }} />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : followers.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No new followers</Text>
            <Text style={styles.emptyDescription}>
              When someone new follows you, they will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={followers}
            renderItem={renderFollower}
            keyExtractor={(item) => item.follower_id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.xl },

  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  followerName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
});
