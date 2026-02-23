import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography } from '@/lib/theme';
import RecipeCard from '@/components/ui/RecipeCard';
import { ForkDot } from '@/components/ui/Logo';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';

type FollowState = 'not_following' | 'following' | 'requested';
type TabId = 'recipes' | 'activity' | 'favorites';

const TABS: { id: TabId; label: string }[] = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'activity', label: 'Activity' },
  { id: 'favorites', label: 'Favorites' },
];

interface ChefProfile {
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    is_private: boolean;
    role: string;
  };
  stats: {
    recipe_count: number;
    cook_count: number;
    follower_count: number;
    following_count: number;
  };
  is_following: boolean;
  is_owner: boolean;
  can_view: boolean;
  activity: { recipe_id: string; recipe_title: string; cooked_at: string; notes: string | null; source_url: string | null; source_name: string | null; source_type: string | null; recipe_visibility: string | null }[];
  favorites: { recipe_id: string; recipe_title: string; recipe_image_url: string | null; favorited_at: string }[];
  published: { id: string; title: string; description: string | null; image_url: string | null; published_at: string }[];
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


type ActivityLinkTarget =
  | { kind: 'internal'; path: string }
  | { kind: 'external'; url: string }
  | { kind: 'none' };

function resolveActivityLink(item: { recipe_id: string; recipe_visibility: string | null; source_url: string | null; source_type: string | null }): ActivityLinkTarget {
  if (item.recipe_visibility === 'public' || !item.recipe_visibility) {
    return { kind: 'internal', path: `/recipe/${item.recipe_id}` };
  }
  if (item.source_url) {
    return { kind: 'external', url: item.source_url };
  }
  if (item.source_type === 'manual' || item.source_type === 'fork') {
    return { kind: 'internal', path: `/recipe/${item.recipe_id}` };
  }
  return { kind: 'none' };
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [chefData, setChefData] = useState<ChefProfile | null>(null);
  const [followState, setFollowState] = useState<FollowState>('not_following');
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('recipes');

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      async function load() {
        const { data } = await supabase.rpc('get_chef_profile', {
          p_chef_id: id!,
        });

        if (!data) {
          setLoading(false);
          return;
        }

        setChefData(data as ChefProfile);
        setFollowerCount(data.stats.follower_count);

        // Determine follow state
        if (data.is_following) {
          setFollowState('following');
        } else if (user && user.id !== id) {
          const { data: requestCheck } = await supabase
            .from('follow_requests')
            .select('id')
            .eq('requester_id', user.id)
            .eq('target_id', id!)
            .single();
          setFollowState(requestCheck ? 'requested' : 'not_following');
        }

        setLoading(false);
      }

      load();
    }, [id, user])
  );

  const handleFollowAction = async () => {
    if (!user || !id || user.id === id || actionLoading || !chefData) return;

    setActionLoading(true);
    try {
      if (followState === 'following') {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
        setFollowState('not_following');
        setFollowerCount((c) => Math.max(0, c - 1));
      } else if (followState === 'requested') {
        await supabase
          .from('follow_requests')
          .delete()
          .eq('requester_id', user.id)
          .eq('target_id', id);
        setFollowState('not_following');
      } else {
        if (chefData.profile.is_private) {
          await supabase
            .from('follow_requests')
            .insert({ requester_id: user.id, target_id: id });
          setFollowState('requested');
        } else {
          await supabase
            .from('user_follows')
            .insert({ follower_id: user.id, following_id: id });
          setFollowState('following');
          setFollowerCount((c) => c + 1);
        }
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ProfileSkeleton />
      </View>
    );
  }

  if (!chefData) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Profile' }} />
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.emptyText}>User not found</Text>
        </View>
      </>
    );
  }

  const { profile, stats, can_view: canView } = chefData;
  const isOwnProfile = user?.id === id;
  const initial = (profile.display_name || '?')[0].toUpperCase();

  const followButtonTitle = {
    following: 'Following',
    requested: 'Requested',
    not_following: profile.is_private ? 'Request to Follow' : 'Follow',
  }[followState];

  return (
    <>
      <Stack.Screen options={{ headerTitle: profile.display_name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Top */}
        <View style={styles.profileTop}>
          {profile.avatar_url ? (
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
            <Text style={styles.profileName}>{profile.display_name}</Text>
            {profile.is_private && (
              <Text style={styles.privateBadge}>Private account</Text>
            )}
            {profile.bio && (
              <Text style={styles.profileBio}>{profile.bio}</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {/* Recipe stats: two equal columns, only when visible */}
          {canView && (
            <View style={styles.recipeStatsRow}>
              <View style={styles.recipeStat}>
                <Text style={styles.recipeStatValue}>{stats.recipe_count}</Text>
                <Text style={styles.recipeStatLabel}>Published</Text>
              </View>
              <View style={styles.statDividerV} />
              <View style={styles.recipeStat}>
                <Text style={styles.recipeStatValue}>{stats.cook_count}</Text>
                <Text style={styles.recipeStatLabel}>Cooked</Text>
              </View>
            </View>
          )}
          {/* Social stats: inline, subordinate */}
          <View style={styles.socialStatsRow}>
            <Text style={styles.socialStatText}><Text style={styles.socialStatValue}>{followerCount}</Text> Followers</Text>
            <Text style={styles.socialStatDot}>·</Text>
            <Text style={styles.socialStatText}><Text style={styles.socialStatValue}>{stats.following_count}</Text> Following</Text>
          </View>
        </View>

        {/* Follow Button */}
        {!isOwnProfile && (
          <View style={styles.followRow}>
            <Pressable
              style={[
                styles.followButton,
                followState === 'not_following' ? styles.followButtonPrimary : styles.followButtonSecondary,
              ]}
              onPress={handleFollowAction}
              disabled={actionLoading}
            >
              <Text style={[
                styles.followButtonText,
                followState === 'not_following' ? styles.followButtonTextPrimary : styles.followButtonTextSecondary,
              ]}>
                {actionLoading ? '...' : followButtonTitle}
              </Text>
            </Pressable>
          </View>
        )}

        {canView ? (
          <>
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

            {/* Recipes Tab */}
            {activeTab === 'recipes' && (
              <View style={styles.tabContent}>
                {(chefData.published || []).length === 0 ? (
                  <EmptyTab message="No published recipes yet" />
                ) : (
                  <View style={styles.recipeList}>
                    {chefData.published.map((recipe) => (
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
                            <View style={[styles.recipeBadge, styles.recipeBadgePub]}>
                              <Text style={[styles.recipeBadgeText, styles.recipeBadgeTextPub]}>Published</Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <View style={styles.tabContent}>
                {(chefData.activity || []).length === 0 ? (
                  <EmptyTab message="No cooking activity yet" />
                ) : (
                  <View style={styles.activityList}>
                    {chefData.activity.map((item, i) => {
                      const link = resolveActivityLink(item);
                      const handlePress = link.kind === 'internal'
                        ? () => router.push(link.path as any)
                        : link.kind === 'external'
                        ? () => Linking.openURL(link.url)
                        : undefined;
                      return (
                        <Pressable
                          key={`${item.recipe_id}-${item.cooked_at}-${i}`}
                          style={styles.activityItem}
                          onPress={handlePress}
                        >
                          <View style={styles.activityRow}>
                            <Text style={styles.activityTitle} numberOfLines={1}>{item.recipe_title}</Text>
                            <Text style={styles.activityDate}>{formatDate(item.cooked_at)}</Text>
                          </View>
                          {(() => {
                            const sourceLabel = item.source_name
                              || (item.source_url ? (() => { try { return new URL(item.source_url!).hostname.replace(/^www\./, ''); } catch { return null; } })() : null)
                              || (item.recipe_visibility === 'private' && item.source_type !== 'manual' && item.source_type !== 'fork' ? 'a cookbook' : null);
                            if (!sourceLabel) return null;
                            const aLink = resolveActivityLink(item);
                            const prefix = item.source_url && aLink.kind === 'external' ? 'via' : 'from';
                            return <Text style={styles.activitySource}>{prefix} {sourceLabel}</Text>;
                          })()}
                          {item.notes && (
                            <Text style={styles.activityNotes} numberOfLines={2}>
                              {'\u201C'}{item.notes}{'\u201D'}
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <View style={styles.tabContent}>
                {(chefData.favorites || []).length === 0 ? (
                  <EmptyTab message="No favorite recipes yet" />
                ) : (
                  <View style={styles.recipeList}>
                    {chefData.favorites.map((item) => (
                      <Pressable
                        key={item.recipe_id}
                        style={styles.recipeItem}
                        onPress={() => router.push(`/recipe/${item.recipe_id}`)}
                      >
                        {item.recipe_image_url ? (
                          <Image
                            source={{ uri: item.recipe_image_url }}
                            style={styles.recipeThumb}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.recipePlaceholder}>
                            <ForkDot size={14} color={colors.inkMuted} />
                          </View>
                        )}
                        <View style={styles.recipeInfo}>
                          <Text style={styles.recipeTitle} numberOfLines={1}>{item.recipe_title}</Text>
                          <Text style={styles.recipeMetaText}>Saved {formatDate(item.favorited_at)}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

          </>
        ) : (
          <View style={styles.privateMessage}>
            <Text style={styles.privateTitle}>This account is private</Text>
            <Text style={styles.privateDescription}>
              Follow this account to see their recipes and activity.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <View style={styles.emptyTab}>
      <Text style={styles.emptyTabText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
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

  // Follow Button
  followRow: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  followButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  followButtonPrimary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  followButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  followButtonText: {
    ...typography.metaSmall,
  },
  followButtonTextPrimary: {
    color: colors.bg,
  },
  followButtonTextSecondary: {
    color: colors.inkSecondary,
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

  // Tab Content
  tabContent: {
    paddingHorizontal: 20,
  },

  // Recipe List (shared for recipes & favorites)
  recipeList: {},
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
  recipeMetaText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  recipeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
  },
  recipeBadgePub: {
    borderColor: colors.olive,
  },
  recipeBadgeText: {
    ...typography.metaSmall,
  },
  recipeBadgeTextPub: {
    color: colors.olive,
  },

  // Activity List
  activityList: {},
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityTitle: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  activityDate: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  activityNotes: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  activitySource: {
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 1,
  },

  // Empty
  emptyText: {
    ...typography.bodySmall,
    color: colors.inkMuted,
  },
  emptyTab: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTabText: {
    ...typography.bodySmall,
    color: colors.inkMuted,
  },

  // Private message
  privateMessage: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  privateTitle: {
    ...typography.subheading,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  privateDescription: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
});
