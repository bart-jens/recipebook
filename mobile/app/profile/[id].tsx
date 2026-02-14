import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';

interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
}

interface PublicRecipe {
  id: string;
  title: string;
  description: string | null;
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
            .select('id, title, description')
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

        // Check if current user follows this profile
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C8553D" />
      </View>
    );
  }

  if (!profile) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Profile' }} />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#6B6B6B' }}>User not found</Text>
        </View>
      </>
    );
  }

  const isOwnProfile = user?.id === id;

  return (
    <>
      <Stack.Screen options={{ headerTitle: profile.display_name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Avatar and name */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.display_name[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile.display_name}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>

        {/* Stats */}
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

        {/* Follow button */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={toggleFollow}
          >
            <Text style={[styles.followText, isFollowing && styles.followingText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Public recipes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Public Recipes</Text>
          {recipes.length === 0 ? (
            <Text style={styles.emptyText}>No published recipes yet.</Text>
          ) : (
            recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              >
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                {recipe.description && (
                  <Text style={styles.recipeDesc} numberOfLines={2}>{recipe.description}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { padding: 20 },

  header: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '600', color: '#6B6B6B' },
  name: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  bio: { fontSize: 14, color: '#6B6B6B', marginTop: 6, textAlign: 'center', lineHeight: 20 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0EBE4',
    marginBottom: 20,
  },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },

  followButton: {
    backgroundColor: '#C8553D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  followText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  followingText: { color: '#6B6B6B' },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#6B6B6B',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE4',
    paddingBottom: 8,
  },
  emptyText: { fontSize: 14, color: '#999', fontStyle: 'italic' },

  recipeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  recipeTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  recipeDesc: { fontSize: 14, color: '#6B6B6B', marginTop: 4, lineHeight: 20 },
});
