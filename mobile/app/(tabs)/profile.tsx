import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, fontFamily } from '@/lib/theme';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';

interface Profile {
  display_name: string;
  bio: string | null;
  role: string;
  plan: string;
  is_private: boolean;
  avatar_url: string | null;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ recipes: 0, published: 0, cooked: 0, followers: 0, following: 0 });
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      async function load() {
        const [
          { data: profileData },
          { data: recipes },
          { data: ratings },
          { data: followers },
          { data: following },
        ] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('display_name, bio, role, plan, is_private, avatar_url')
            .eq('id', user!.id)
            .single(),
          supabase
            .from('recipes')
            .select('id, visibility')
            .eq('created_by', user!.id),
          supabase
            .from('recipe_ratings')
            .select('id')
            .eq('user_id', user!.id),
          supabase
            .from('user_follows')
            .select('id')
            .eq('following_id', user!.id),
          supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user!.id),
        ]);

        setProfile(profileData);
        setStats({
          recipes: (recipes || []).length,
          published: (recipes || []).filter((r) => r.visibility === 'public').length,
          cooked: (ratings || []).length,
          followers: (followers || []).length,
          following: (following || []).length,
        });

        // Count pending follow requests for private users
        if (profileData?.is_private) {
          const { count } = await supabase
            .from('follow_requests')
            .select('id', { count: 'exact', head: true })
            .eq('target_id', user!.id);
          setPendingRequests(count || 0);
        } else {
          setPendingRequests(0);
        }

        setLoading(false);
      }

      load();
    }, [user])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ProfileSkeleton />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Avatar name={profile?.display_name || '?'} size="lg" imageUrl={profile?.avatar_url} />
        </View>
        <Text style={styles.name}>{profile?.display_name || 'Anonymous'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {profile?.is_private && (
          <Text style={styles.privateLabel}>Private account</Text>
        )}
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.recipes}</Text>
          <Text style={styles.statLabel}>recipes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.published}</Text>
          <Text style={styles.statLabel}>published</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.cooked}</Text>
          <Text style={styles.statLabel}>cooked</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.followers}</Text>
          <Text style={styles.statLabel}>followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.following}</Text>
          <Text style={styles.statLabel}>following</Text>
        </View>
      </View>

      {pendingRequests > 0 && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={() => router.push('/profile/requests')}
          activeOpacity={0.7}
        >
          <Text style={styles.requestsText}>Follow requests</Text>
          <View style={styles.requestsBadge}>
            <Text style={styles.requestsBadgeText}>{pendingRequests}</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Badge
          label={profile?.plan === 'premium' ? 'Premium plan' : 'Free plan'}
          variant={profile?.plan === 'premium' ? 'premium' : 'default'}
        />
      </View>

      <View style={styles.actions}>
        <Button
          title="Edit Profile"
          variant="secondary"
          size="lg"
          onPress={() => router.push('/profile/edit')}
        />
        <Button
          title="Sign out"
          variant="ghost"
          size="lg"
          onPress={signOut}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarWrap: { marginBottom: spacing.md },
  name: {
    ...typography.h2,
    fontFamily: fontFamily.serifBold,
    color: colors.text,
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  privateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bio: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xxl,
  },
  stat: { alignItems: 'center' },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    marginBottom: spacing.xxl,
  },
  requestsText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
  requestsBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  requestsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  section: { alignItems: 'center', marginBottom: spacing.xxl },
  actions: { gap: spacing.sm },
});
