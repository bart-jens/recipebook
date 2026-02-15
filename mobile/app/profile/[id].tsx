import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, fontFamily } from '@/lib/theme';
import Avatar from '@/components/ui/Avatar';
import SectionHeader from '@/components/ui/SectionHeader';
import RecipeCard from '@/components/ui/RecipeCard';
import Button from '@/components/ui/Button';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';

interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
}

interface PublicRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      async function load() {
        const [
          { data: profileData },
          { data: publicRecipes },
          { data: followers },
          { data: following },
        ] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id, display_name, bio')
            .eq('id', id!)
            .single(),
          supabase
            .from('recipes')
            .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes')
            .eq('created_by', id!)
            .eq('visibility', 'public')
            .order('published_at', { ascending: false }),
          supabase
            .from('user_follows')
            .select('id')
            .eq('following_id', id!),
          supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', id!),
        ]);

        setProfile(profileData);
        setRecipes(publicRecipes || []);
        setFollowerCount((followers || []).length);
        setFollowingCount((following || []).length);

        if (user && user.id !== id) {
          const { data: followCheck } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', id!)
            .single();
          setIsFollowing(!!followCheck);
        }

        setLoading(false);
      }

      load();
    }, [id, user])
  );

  const toggleFollow = async () => {
    if (!user || !id || user.id === id) return;

    if (isFollowing) {
      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', id);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: id });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ProfileSkeleton />
      </View>
    );
  }

  if (!profile) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Profile' }} />
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.emptyText}>User not found</Text>
        </View>
      </>
    );
  }

  const isOwnProfile = user?.id === id;

  return (
    <>
      <Stack.Screen options={{ headerTitle: profile.display_name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar name={profile.display_name} size="lg" />
          <Text style={styles.name}>{profile.display_name}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{recipes.length}</Text>
            <Text style={styles.statLabel}>recipes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>following</Text>
          </View>
        </View>

        {!isOwnProfile && (
          <View style={styles.followButtonContainer}>
            <Button
              title={isFollowing ? 'Following' : 'Follow'}
              onPress={toggleFollow}
              variant={isFollowing ? 'secondary' : 'primary'}
              size="lg"
            />
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="PUBLIC RECIPES" />
          {recipes.length === 0 ? (
            <Text style={styles.emptyRecipesText}>No published recipes yet.</Text>
          ) : (
            <View style={styles.recipeList}>
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={{
                    ...recipe,
                    creatorName: profile?.display_name,
                  }}
                  variant="compact"
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.xl },

  header: { alignItems: 'center', marginBottom: spacing.xl },
  name: {
    fontFamily: fontFamily.serifBold,
    fontSize: 24,
    color: colors.text,
    marginTop: spacing.md,
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
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  followButtonContainer: {
    marginBottom: spacing.xxl,
  },

  section: { marginBottom: spacing.xl },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  emptyRecipesText: { ...typography.bodySmall, color: colors.textMuted, fontStyle: 'italic' },

  recipeList: {
    gap: spacing.md,
  },
});
