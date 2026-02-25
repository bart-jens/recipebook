import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';
import { RecipePlaceholder } from '@/lib/recipe-placeholder';

interface FeedItem {
  event_type: string;
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name: string;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  rating: number | null;
  recipe_visibility: string | null;
  recipe_source_type: string | null;
}

interface SuggestionRecipe {
  id: string;
  title: string;
  image_url: string | null;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  recipe_tags?: { tag: string }[];
}

interface RecentCook {
  id: string;
  cooked_at: string;
  recipes: { id: string; title: string } | null;
}


type FeedLinkTarget =
  | { kind: 'internal'; path: string }
  | { kind: 'external'; url: string }
  | { kind: 'none' };

function resolveLink(item: FeedItem): FeedLinkTarget {
  if (item.recipe_visibility === 'public') {
    return { kind: 'internal', path: `/recipe/${item.recipe_id}` };
  }
  if (item.source_url) {
    return { kind: 'external', url: item.source_url };
  }
  // Fall back to recipe page — private recipe pages show a metadata card gracefully
  return { kind: 'internal', path: `/recipe/${item.recipe_id}` };
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRecipe[]>([]);
  const [recentCooks, setRecentCooks] = useState<RecentCook[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreFeed, setHasMoreFeed] = useState(false);
  const previousFeedCount = useRef(0);

  const recipeSelectFields = 'id, title, image_url, description, prep_time_minutes, cook_time_minutes, recipe_tags(tag)';

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) return;

    try {
      const [
        { data: profile },
        { data: following },
        { data: cooks },
      ] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id),
        supabase
          .from('cook_log')
          .select('id, cooked_at, recipes(id, title)')
          .eq('user_id', user.id)
          .order('cooked_at', { ascending: false })
          .limit(3),
      ]);

      setDisplayName(profile?.display_name || '');
      setRecentCooks((cooks || []) as unknown as RecentCook[]);

      // Always show user's own recent recipes
      const { data: recent } = await supabase
        .from('recipes')
        .select(recipeSelectFields)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);
      setSuggestions((recent || []) as SuggestionRecipe[]);

      const followedIds = (following || []).map((f) => f.following_id);
      setFollowingCount(followedIds.length);

      // Activity feed via RPC
      if (followedIds.length > 0) {
        const { data: feed } = await supabase.rpc('get_activity_feed', {
          p_user_id: user.id,
          p_limit: 20,
        });
        const items = (feed || []) as FeedItem[];
        setFeedItems(items);
        setHasMoreFeed(items.length === 20);

        // Haptic feedback on refresh if new items
        if (isRefresh && items.length > previousFeedCount.current) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        previousFeedCount.current = items.length;
      } else {
        setFeedItems([]);
        setHasMoreFeed(false);
      }
    } catch (e) {
      console.error('loadData failed:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, [loadData]);

  const loadMoreFeed = useCallback(async () => {
    if (loadingMore || !hasMoreFeed || feedItems.length === 0 || !user) return;
    setLoadingMore(true);
    const lastItem = feedItems[feedItems.length - 1];
    const { data } = await supabase.rpc('get_activity_feed', {
      p_user_id: user.id,
      p_before: lastItem.event_at,
      p_limit: 20,
    });
    const newItems = (data || []) as FeedItem[];
    setFeedItems((prev) => [...prev, ...newItems]);
    setHasMoreFeed(newItems.length === 20);
    setLoadingMore(false);
  }, [loadingMore, hasMoreFeed, feedItems, user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <HomeSkeleton />
      </View>
    );
  }

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const actionVerb = (type: string) => {
    switch (type) {
      case 'cooked': return ' cooked ';
      case 'created': return ' published ';
      case 'favorited': return ' favorited ';
      default: return ' ';
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getTag = (recipe: SuggestionRecipe) => {
    const tags = recipe.recipe_tags;
    if (tags && tags.length > 0) return tags[0].tag;
    return null;
  };


  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= rating ? 'star' : 'star-o'}
          size={11}
          color={i <= rating ? colors.accent : colors.border}
          style={{ marginRight: 1 }}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  // Sections rendered as header (carousel) and footer (activity)
  const renderHeader = () => (
    <View>
      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.actionButton} onPress={() => setShowImportMenu(true)}>
          <Text style={styles.actionButtonText}>Import</Text>
        </Pressable>
        <Pressable style={styles.actionButtonPrimary} onPress={() => router.push('/recipe/new')}>
          <Text style={styles.actionButtonPrimaryText}>Create</Text>
        </Pressable>
      </View>

      {/* Recipe Carousel */}
      {suggestions.length > 0 && (
        <View>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselTitle}>Your Recipes</Text>
            <Text style={styles.carouselCount}>{suggestions.length} total</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselScroll}
          >
            {suggestions.map((recipe) => (
              <Pressable
                key={recipe.id}
                style={styles.carouselCard}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              >
                {recipe.image_url ? (
                  <Image
                    source={{ uri: recipe.image_url }}
                    style={styles.carouselImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={recipe.image_url}
                  />
                ) : (
                  <RecipePlaceholder id={recipe.id} size={140} />
                )}
                <View style={styles.carouselCardBody}>
                  {getTag(recipe) && (
                    <Text style={styles.carouselTag}>{getTag(recipe)}</Text>
                  )}
                  <Text style={styles.carouselCardTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  {(recipe.cook_time_minutes || recipe.prep_time_minutes) && (
                    <Text style={styles.carouselTime}>
                      {formatTime(recipe.cook_time_minutes || recipe.prep_time_minutes)}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Thin Rule before activity */}
      <View style={[styles.ruleThin, { marginTop: 12 }]} />

      {/* 6. Activity Ticker Header */}
      {feedItems.length > 0 ? (
        <View style={styles.tickerHeader}>
          <Text style={styles.tickerTitle}>Activity</Text>
        </View>
      ) : followingCount === 0 ? (
        <View style={styles.promptSection}>
          <Text style={styles.tickerTitle}>Activity</Text>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Follow some chefs to see what they are cooking</Text>
            <Pressable
              style={styles.promptButton}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <Text style={styles.promptButtonText}>Discover Chefs</Text>
            </Pressable>
          </View>
        </View>
      ) : feedItems.length === 0 ? (
        <View style={styles.promptSection}>
          <Text style={styles.tickerTitle}>Activity</Text>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Your chefs have not been cooking lately</Text>
            <Pressable
              style={styles.promptButton}
              onPress={() => router.push('/(tabs)/recipes')}
            >
              <Text style={styles.promptButtonText}>My recipes</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

    </View>
  );

  const renderTickerItem = ({ item, index }: { item: FeedItem; index: number }) => (
      <View style={styles.tickerItem}>
        <Pressable onPress={() => router.push(`/profile/${item.user_id}`)}>
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={styles.tickerAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.avatar_url}
            />
          ) : (
            <View style={styles.tickerAvatarFallback}>
              <Text style={styles.tickerAvatarLetter}>
                {(item.display_name?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
        <View style={styles.tickerBody}>
          <Text style={styles.tickerText} numberOfLines={2}>
            <Text style={styles.tickerName} onPress={() => router.push(`/profile/${item.user_id}`)}>
              {item.display_name}
            </Text>
            {actionVerb(item.event_type)}
            {(() => {
              const link = resolveLink(item);
              const onPressRecipe = link.kind === 'internal'
                ? () => router.push(link.path as any)
                : link.kind === 'external'
                ? () => Linking.openURL(link.url)
                : undefined;
              return (
                <Text style={styles.tickerRecipe} onPress={onPressRecipe}>
                  {item.recipe_title}
                </Text>
              );
            })()}
          </Text>
          {item.event_type === 'cooked' && item.rating != null && renderStars(item.rating)}
          {(() => {
            const link = resolveLink(item);
            const sourceLabel = item.source_name
              || (item.source_url ? (() => { try { return new URL(item.source_url!).hostname.replace(/^www\./, ''); } catch { return null; } })() : null)
              || (item.recipe_visibility === 'private' && item.recipe_source_type !== 'manual' && item.recipe_source_type !== 'fork' ? 'a cookbook' : null);

            if (!sourceLabel) return null;
            const prefix = item.source_url && link.kind === 'external' ? 'via' : 'from';
            return <Text style={styles.tickerSource}>{prefix} {sourceLabel}</Text>;
          })()}
        </View>
        <Text style={styles.tickerTime}>{formatTimeAgo(item.event_at)}</Text>
      </View>
  );

  const renderFooter = () => (
    <View>
      {loadingMore && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.inkMuted} />
        </View>
      )}
      <View style={{ height: 100 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        style={{ flex: 1 }}
        data={feedItems.length > 0 ? feedItems : []}
        keyExtractor={(item, i) => `${item.event_type}-${item.recipe_id}-${item.event_at}-${i}`}
        renderItem={renderTickerItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreFeed}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.inkMuted}
          />
        }
      />
      {showImportMenu && (
        <Pressable style={styles.modalOverlay} onPress={() => setShowImportMenu(false)}>
          <View style={styles.importMenu}>
            <Text style={styles.importMenuTitle}>Import Recipe</Text>
            <TouchableOpacity
              style={styles.importOption}
              activeOpacity={0.7}
              onPress={() => { setShowImportMenu(false); router.push('/recipe/import-url'); }}
            >
              <FontAwesome name="link" size={18} color={colors.accent} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>From Link</Text>
                <Text style={styles.importOptionDesc}>Paste a link from any recipe site or Instagram</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.importOption}
              activeOpacity={0.7}
              onPress={() => { setShowImportMenu(false); router.push('/recipe/import-photo'); }}
            >
              <FontAwesome name="camera" size={18} color={colors.accent} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>From Photo</Text>
                <Text style={styles.importOptionDesc}>Scan a photo of a recipe with AI</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  actionButtonPrimary: {
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonPrimaryText: {
    ...typography.metaSmall,
    color: colors.bg,
  },

  // Import modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  importMenu: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  importMenuTitle: {
    ...typography.subheading,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  importOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.lg,
  },
  importOptionText: { flex: 1 },
  importOptionTitle: {
    ...typography.label,
    color: colors.ink,
  },
  importOptionDesc: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    marginTop: 2,
  },

  // Recipe Carousel
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  carouselTitle: {
    ...typography.subheading,
    color: colors.ink,
  },
  carouselCount: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  carouselScroll: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 16,
  },
  carouselCard: {
    width: 140,
  },
  carouselImage: {
    width: 140,
    height: 140,
    borderRadius: 0,
  },
  carouselCardBody: {
    paddingTop: 8,
  },
  carouselTag: {
    ...typography.metaSmall,
    color: colors.accent,
    marginBottom: 2,
  },
  carouselCardTitle: {
    ...typography.label,
    color: colors.ink,
    marginBottom: 2,
  },
  carouselTime: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },

  // Thin Rule
  ruleThin: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },

  // 6. Activity Ticker
  tickerHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tickerTitle: {
    ...typography.subheading,
    color: colors.ink,
  },
  tickerItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  tickerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  tickerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tickerAvatarLetter: {
    fontSize: 14,
    fontFamily: fontFamily.sans,
    color: colors.inkMuted,
  },
  tickerBody: {
    flex: 1,
    minWidth: 0,
  },
  tickerText: {
    ...typography.bodySmall,
    color: colors.ink,
  },
  tickerName: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
  },
  tickerRecipe: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.accent,
  },
  tickerTime: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  tickerSource: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  // Loading
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  // Empty / prompt states
  promptSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  promptCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
  },
  promptTitle: {
    ...typography.label,
    color: colors.inkSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  promptButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.ink,
  },
  promptButtonText: {
    ...typography.metaSmall,
    color: colors.bg,
  },
});
