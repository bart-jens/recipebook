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
import { colors, spacing, typography } from '@/lib/theme';
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
  const [stats, setStats] = useState({ recipes: 0, published: 0, cooked: 0, saved: 0, followers: 0, following: 0 });
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
          { data: cookLog },
          { data: savedEntries },
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
            .from('cook_log')
            .select('recipe_id')
            .eq('user_id', user!.id),
          supabase
            .from('saved_recipes')
            .select('recipe_id')
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
          cooked: new Set((cookLog || []).map((c) => c.recipe_id)).size,
          saved: (savedEntries || []).length,
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

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickActionButton} onPress={() => router.push('/invites')}>
          <Text style={styles.quickActionText}>Invite Friends</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={() => router.push('/(tabs)/shopping-list')}>
          <Text style={styles.quickActionText}>Grocery List</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {/* Recipe stats: three equal columns */}
        <View style={styles.recipeStatsRow}>
          <Pressable style={styles.recipeStat} onPress={() => router.push({ pathname: '/(tabs)/recipes', params: { filter: 'published' } })}>
            <Text style={styles.recipeStatValue}>{stats.published}</Text>
            <Text style={styles.recipeStatLabel}>Published</Text>
          </Pressable>
          <View style={styles.statDividerV} />
          <Pressable style={styles.recipeStat} onPress={() => router.push({ pathname: '/(tabs)/recipes', params: { filter: 'cooked' } })}>
            <Text style={styles.recipeStatValue}>{stats.cooked}</Text>
            <Text style={styles.recipeStatLabel}>Cooked</Text>
          </Pressable>
          <View style={styles.statDividerV} />
          <Pressable style={styles.recipeStat} onPress={() => router.push({ pathname: '/(tabs)/recipes', params: { filter: 'saved' } })}>
            <Text style={styles.recipeStatValue}>{stats.saved}</Text>
            <Text style={styles.recipeStatLabel}>Saved</Text>
          </Pressable>
        </View>
        {/* Social stats: inline, subordinate */}
        <View style={styles.socialStatsRow}>
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/discover', params: { tab: 'chefs' } })}>
            <Text style={styles.socialStatText}><Text style={styles.socialStatValue}>{stats.following}</Text> Following</Text>
          </Pressable>
          <Text style={styles.socialStatDot}>·</Text>
          <Pressable onPress={() => router.push('/profile/followers')}>
            <Text style={styles.socialStatText}><Text style={styles.socialStatValue}>{stats.followers}</Text> Followers</Text>
          </Pressable>
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
        <Pressable style={styles.actionButton} onPress={() => setFeedbackVisible(true)}>
          <Text style={styles.actionButtonText}>Send Feedback</Text>
        </Pressable>
        <Pressable style={styles.actionButtonGhost} onPress={() => WebBrowser.openBrowserAsync('https://eefeats.com/privacy')}>
          <Text style={styles.actionButtonGhostText}>Privacy Policy</Text>
        </Pressable>
        <Pressable style={styles.actionButtonGhost} onPress={() => WebBrowser.openBrowserAsync('https://eefeats.com/terms')}>
          <Text style={styles.actionButtonGhostText}>Terms of Service</Text>
        </Pressable>
        <Pressable style={styles.actionButtonGhost} onPress={() => WebBrowser.openBrowserAsync('https://eefeats.com/support')}>
          <Text style={styles.actionButtonGhostText}>Support</Text>
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
    ...typography.heading,
    fontSize: 24,
    color: colors.bg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.heading,
    color: colors.ink,
  },
  privateBadge: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginTop: 4,
  },
  profileBio: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    marginTop: 4,
  },

  // Stats
  statsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderTopWidth: 3,
    borderTopColor: colors.ink,
  },
  recipeStatsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recipeStat: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statDividerV: {
    width: 1,
    backgroundColor: colors.border,
  },
  recipeStatValue: {
    fontSize: 22,
    fontFamily: fontFamily.sans,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  recipeStatLabel: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginTop: 2,
  },
  socialStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    gap: 16,
  },
  socialStatText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  socialStatValue: {
    ...typography.metaSmall,
    color: colors.ink,
  },
  socialStatDot: {
    ...typography.metaSmall,
    color: colors.border,
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
    ...typography.metaSmall,
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
    ...typography.metaSmall,
    color: colors.bg,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
  },
  quickActionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickActionText: {
    ...typography.metaSmall,
    color: colors.ink,
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
    ...typography.metaSmall,
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
    ...typography.body,
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
    ...typography.metaSmall,
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
    ...typography.bodySmall,
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
    ...typography.metaSmall,
    color: colors.ink,
  },
  actionButtonGhost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonGhostText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
});
