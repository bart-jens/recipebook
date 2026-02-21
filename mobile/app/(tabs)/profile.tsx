import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, fontFamily } from '@/lib/theme';
import { ForkDot } from '@/components/ui/Logo';
import FeedbackModal from '@/components/FeedbackModal';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';
import * as WebBrowser from 'expo-web-browser';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

interface Profile {
  display_name: string;
  bio: string | null;
  role: string;
  plan: string;
  is_private: boolean;
  avatar_url: string | null;
}

interface RecentRecipe {
  id: string;
  title: string;
  visibility: string;
  image_url: string | null;
}

type TabId = 'recipes' | 'activity' | 'favorites';

const TABS: { id: TabId; label: string }[] = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'activity', label: 'Activity' },
  { id: 'favorites', label: 'Favorites' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ recipes: 0, published: 0, cooked: 0, followers: 0, following: 0 });
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [newFollowerCount, setNewFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('recipes');

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your recipes, ratings, and follows. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'All your data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete my account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const { data: { session: currentSession } } = await supabase.auth.getSession();
                      const response = await fetch(`${API_BASE}/api/auth/delete-account`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${currentSession?.access_token || ''}`,
                          'Cookie': `sb-access-token=${currentSession?.access_token || ''}; sb-refresh-token=${currentSession?.refresh_token || ''}`,
                        },
                      });

                      if (!response.ok) {
                        const data = await response.json();
                        Alert.alert('Error', data.error || 'Failed to delete account');
                        return;
                      }

                      await signOut();
                    } catch {
                      Alert.alert('Error', 'Could not connect to server');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

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
            .select('id, title, visibility, image_url')
            .eq('created_by', user!.id)
            .order('updated_at', { ascending: false }),
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
        setRecentRecipes((recipes || []).slice(0, 8));
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

        // Count new followers since last seen
        const { data: followerCount } = await supabase.rpc('get_new_follower_count', {
          p_user_id: user!.id,
        });
        setNewFollowerCount(followerCount ?? 0);

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

  const displayName = profile?.display_name || 'Anonymous';
  const initial = displayName[0].toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Top */}
      <View style={styles.profileTop}>
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          {profile?.is_private && (
            <Text style={styles.privateBadge}>Private account</Text>
          )}
          {profile?.bio && (
            <Text style={styles.profileBio}>{profile.bio}</Text>
          )}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.recipes}</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.published}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.cooked}</Text>
          <Text style={styles.statLabel}>Cooked</Text>
        </View>
        <View style={[styles.stat, styles.statLast]}>
          <Text style={styles.statValue}>{stats.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
      </View>

      {/* Banners */}
      {pendingRequests > 0 && (
        <Pressable
          style={styles.banner}
          onPress={() => router.push('/profile/requests')}
        >
          <Text style={styles.bannerText}>Follow requests</Text>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>{pendingRequests}</Text>
          </View>
        </Pressable>
      )}

      {newFollowerCount > 0 && (
        <Pressable
          style={styles.banner}
          onPress={() => router.push('/profile/new-followers')}
        >
          <Text style={styles.bannerText}>New followers</Text>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>
              {newFollowerCount > 9 ? '9+' : newFollowerCount}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Plan Badge */}
      <View style={styles.planRow}>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>
            {profile?.plan === 'premium' ? 'Premium plan' : 'Free plan'}
          </Text>
        </View>
      </View>

      {/* Nav Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'recipes' && recentRecipes.length > 0 && (
        <View style={styles.recipeList}>
          {recentRecipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={styles.recipeItem}
              onPress={() => router.push(`/recipe/${recipe.id}`)}
            >
              {recipe.image_url ? (
                <Image
                  source={{ uri: recipe.image_url }}
                  style={styles.recipeThumb}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.recipePlaceholder}>
                  <ForkDot size={14} color={colors.inkMuted} />
                </View>
              )}
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
                <View style={styles.recipeMeta}>
                  <View style={[
                    styles.recipeBadge,
                    recipe.visibility === 'public' ? styles.recipeBadgePub : styles.recipeBadgePriv,
                  ]}>
                    <Text style={[
                      styles.recipeBadgeText,
                      recipe.visibility === 'public' ? styles.recipeBadgeTextPub : styles.recipeBadgeTextPriv,
                    ]}>
                      {recipe.visibility === 'public' ? 'Published' : 'Private'}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {activeTab === 'recipes' && recentRecipes.length === 0 && (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyTabText}>No recipes yet</Text>
        </View>
      )}

      {activeTab === 'activity' && (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyTabText}>No cooking activity yet</Text>
        </View>
      )}

      {activeTab === 'favorites' && (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyTabText}>No favorites yet</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => router.push('/profile/edit')}>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => router.push('/invites')}>
          <Text style={styles.actionButtonText}>Invite Friends</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => setFeedbackVisible(true)}>
          <Text style={styles.actionButtonText}>Send Feedback</Text>
        </Pressable>
        <Pressable style={styles.actionButtonGhost} onPress={() => WebBrowser.openBrowserAsync(`${API_BASE}/privacy`)}>
          <Text style={styles.actionButtonGhostText}>Privacy Policy</Text>
        </Pressable>
        <Pressable style={styles.actionButtonGhost} onPress={() => WebBrowser.openBrowserAsync(`${API_BASE}/terms`)}>
          <Text style={styles.actionButtonGhostText}>Terms of Service</Text>
        </Pressable>
        <Pressable style={styles.actionButtonGhost} onPress={signOut}>
          <Text style={styles.actionButtonGhostText}>Sign out</Text>
        </Pressable>
        <Pressable style={styles.actionButtonGhost} onPress={handleDeleteAccount}>
          <Text style={[styles.actionButtonGhostText, { color: colors.danger }]}>Delete Account</Text>
        </Pressable>
      </View>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        sourceScreen="profile"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 100 },

  // Profile Top
  profileTop: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarInitial: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    color: colors.bg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 28,
    color: colors.ink,
  },
  privateBadge: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.inkMuted,
    marginTop: 4,
  },
  profileBio: {
    fontFamily: fontFamily.sansLight,
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
    marginTop: 4,
  },

  // Stats Bar
  statsBar: {
    marginHorizontal: 20,
    marginTop: 20,
    borderTopWidth: 3,
    borderTopColor: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  statLast: {
    borderRightWidth: 0,
  },
  statValue: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: colors.inkMuted,
    marginTop: 1,
  },

  // Banners
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.ink,
  },
  bannerBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  bannerBadgeText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    color: colors.bg,
  },

  // Plan
  planRow: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  planBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  planBadgeText: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.inkMuted,
  },

  // Nav Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingRight: 14,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    marginBottom: -1,
  },
  tabText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.66,
    color: colors.inkMuted,
  },
  tabTextActive: {
    color: colors.ink,
  },

  // Recipe List
  recipeList: {
    paddingHorizontal: 20,
  },
  recipeItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  recipeThumb: {
    width: 48,
    height: 48,
    borderRadius: 0,
  },
  recipePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
    minWidth: 0,
  },
  recipeTitle: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    lineHeight: 20,
    color: colors.ink,
    marginBottom: 2,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recipeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
  },
  recipeBadgePub: {
    borderColor: colors.olive,
  },
  recipeBadgePriv: {
    borderColor: colors.border,
  },
  recipeBadgeText: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  recipeBadgeTextPub: {
    color: colors.olive,
  },
  recipeBadgeTextPriv: {
    color: colors.inkMuted,
  },

  // Empty Tab
  emptyTab: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTabText: {
    fontFamily: fontFamily.sansLight,
    fontSize: 13,
    color: colors.inkMuted,
  },

  // Actions
  actions: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.ink,
  },
  actionButtonGhost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonGhostText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.inkMuted,
  },
});
