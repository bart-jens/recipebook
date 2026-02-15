import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
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
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ recipes: 0, published: 0, cooked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const [{ data: profileData }, { data: recipes }, { data: ratings }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('display_name, bio, role, plan')
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
      ]);

      setProfile(profileData);
      setStats({
        recipes: (recipes || []).length,
        published: (recipes || []).filter((r) => r.visibility === 'public').length,
        cooked: (ratings || []).length,
      });
      setLoading(false);
    }

    load();
  }, [user]);

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
          <Avatar name={profile?.display_name || '?'} size="lg" />
        </View>
        <Text style={styles.name}>{profile?.display_name || 'Anonymous'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
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
          <Text style={styles.statLabel}>times cooked</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Badge
          label={profile?.plan === 'premium' ? 'Premium plan' : 'Free plan'}
          variant={profile?.plan === 'premium' ? 'premium' : 'default'}
        />
      </View>

      <Button
        title="Sign out"
        variant="secondary"
        size="lg"
        onPress={signOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  section: { alignItems: 'center', marginBottom: spacing.xxxl },
});
