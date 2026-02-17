import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, fontFamily, radii } from '@/lib/theme';
import Avatar from '@/components/ui/Avatar';
import RecipeCard from '@/components/ui/RecipeCard';
import RecommendationCard from '@/components/ui/RecommendationCard';
import Button from '@/components/ui/Button';
import { ForkDot } from '@/components/ui/Logo';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';

type FollowState = 'not_following' | 'following' | 'requested';
type TabId = 'activity' | 'favorites' | 'published' | 'recommendations';

const TABS: { id: TabId; label: string }[] = [
  { id: 'activity', label: 'Activity' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'published', label: 'Published' },
  { id: 'recommendations', label: 'Recs' },
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
  activity: { recipe_id: string; recipe_title: string; cooked_at: string; notes: string | null }[];
  favorites: { recipe_id: string; recipe_title: string; recipe_image_url: string | null; favorited_at: string }[];
  published: { id: string; title: string; description: string | null; image_url: string | null; published_at: string }[];
  recommendations: { share_id: string; title: string; source_url: string | null; source_name: string | null; source_type: string; image_url: string | null; tags: string[] | null; user_rating: number | null; share_notes: string | null; shared_at: string; recipe_id: string }[];
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [chefData, setChefData] = useState<ChefProfile | null>(null);
  const [followState, setFollowState] = useState<FollowState>('not_following');
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('activity');

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

  const followButtonTitle = {
    following: 'Following',
    requested: 'Requested',
    not_following: profile.is_private ? 'Request to Follow' : 'Follow',
  }[followState];

  const followButtonVariant = followState === 'not_following' ? 'primary' : 'secondary';

  return (
    <>
      <Stack.Screen options={{ headerTitle: profile.display_name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar name={profile.display_name} size="lg" imageUrl={profile.avatar_url} />
          <Text style={styles.name}>{profile.display_name}</Text>
          {profile.is_private && (
            <Text style={styles.privateLabel}>Private account</Text>
          )}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>

        <View style={styles.statsRow}>
          {canView && (
            <>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{stats.recipe_count}</Text>
                <Text style={styles.statLabel}>recipes</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{stats.cook_count}</Text>
                <Text style={styles.statLabel}>cooked</Text>
              </View>
            </>
          )}
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.following_count}</Text>
            <Text style={styles.statLabel}>following</Text>
          </View>
        </View>

        {!isOwnProfile && (
          <View style={styles.followButtonContainer}>
            <Button
              title={followButtonTitle}
              onPress={handleFollowAction}
              variant={followButtonVariant}
              size="lg"
              loading={actionLoading}
            />
          </View>
        )}

        {canView ? (
          <>
            {/* Tab bar */}
            <View style={styles.tabBar}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab content */}
            {activeTab === 'activity' && (
              <View style={styles.tabContent}>
                {(chefData.activity || []).length === 0 ? (
                  <EmptyTab message="No cooking activity yet" />
                ) : (
                  <View style={styles.itemList}>
                    {chefData.activity.map((item, i) => (
                      <TouchableOpacity
                        key={`${item.recipe_id}-${item.cooked_at}-${i}`}
                        style={styles.activityItem}
                        activeOpacity={0.7}
                        onPress={() => router.push(`/recipe/${item.recipe_id}`)}
                      >
                        <View style={styles.activityRow}>
                          <Text style={styles.activityTitle} numberOfLines={1}>{item.recipe_title}</Text>
                          <Text style={styles.activityDate}>{formatDate(item.cooked_at)}</Text>
                        </View>
                        {item.notes && (
                          <Text style={styles.activityNotes} numberOfLines={2}>
                            {'\u201C'}{item.notes}{'\u201D'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'favorites' && (
              <View style={styles.tabContent}>
                {(chefData.favorites || []).length === 0 ? (
                  <EmptyTab message="No favorite recipes yet" />
                ) : (
                  <View style={styles.itemList}>
                    {chefData.favorites.map((item) => (
                      <TouchableOpacity
                        key={item.recipe_id}
                        style={styles.favoriteItem}
                        activeOpacity={0.7}
                        onPress={() => router.push(`/recipe/${item.recipe_id}`)}
                      >
                        {item.recipe_image_url ? (
                          <Image
                            source={{ uri: item.recipe_image_url }}
                            style={styles.favImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.favPlaceholder}>
                            <ForkDot size={14} color="rgba(45,95,93,0.2)" />
                          </View>
                        )}
                        <View style={styles.favInfo}>
                          <Text style={styles.favTitle} numberOfLines={1}>{item.recipe_title}</Text>
                          <Text style={styles.favDate}>Saved {formatDate(item.favorited_at)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'published' && (
              <View style={styles.tabContent}>
                {(chefData.published || []).length === 0 ? (
                  <EmptyTab message="No published recipes yet" />
                ) : (
                  <View style={styles.itemList}>
                    {chefData.published.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={{
                          id: recipe.id,
                          title: recipe.title,
                          description: recipe.description,
                          image_url: recipe.image_url,
                          creatorName: profile.display_name,
                        }}
                        variant="compact"
                        onPress={() => router.push(`/recipe/${recipe.id}`)}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'recommendations' && (
              <View style={styles.tabContent}>
                {(chefData.recommendations || []).length === 0 ? (
                  <EmptyTab message="No recommendations yet" />
                ) : (
                  <View style={styles.itemList}>
                    {chefData.recommendations.map((card) => (
                      <RecommendationCard
                        key={card.share_id}
                        shareId={card.share_id}
                        title={card.title}
                        sourceUrl={card.source_url}
                        sourceName={card.source_name}
                        sourceType={card.source_type}
                        imageUrl={card.image_url}
                        tags={card.tags}
                        userRating={card.user_rating}
                        shareNotes={card.share_notes}
                        sharedAt={card.shared_at}
                        sharerName={profile.display_name}
                        sharerAvatarUrl={profile.avatar_url}
                        sharerId={id!}
                        recipeId={card.recipe_id}
                      />
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
      <ForkDot size={20} color="rgba(45,95,93,0.3)" />
      <Text style={styles.emptyTabText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.xl },

  header: { alignItems: 'center', marginBottom: spacing.xl },
  name: {
    fontFamily: fontFamily.sansBold,
    fontSize: 24,
    color: colors.text,
    marginTop: spacing.md,
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

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md - 2,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },

  tabContent: {
    marginBottom: spacing.xl,
  },
  itemList: {
    gap: spacing.md,
  },

  activityItem: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  activityDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  activityNotes: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  favImage: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
  },
  favPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favInfo: {
    flex: 1,
    minWidth: 0,
  },
  favTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  favDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  emptyTab: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accentWashBorder,
    backgroundColor: colors.accentWash,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  privateMessage: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  privateTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  privateDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
