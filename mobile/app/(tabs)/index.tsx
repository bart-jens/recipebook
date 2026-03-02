import { useState, useCallback, useRef, useEffect } from 'react';
import type { FeedItem } from '../../../shared/types/domain';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, fontFamily, typography, shadows, radii } from '@/lib/theme';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';
import { RecipePlaceholder } from '@/lib/recipe-placeholder';
import { fetchFeed } from '@/lib/queries/feed';
import { queryKeys } from '@/lib/queries/keys';
import type { SuggestionRecipe, RecentCook } from '@/lib/queries/feed';


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
  const queryClient = useQueryClient();
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreFeed, setHasMoreFeed] = useState(false);
  const [extraFeedItems, setExtraFeedItems] = useState<FeedItem[]>([]);
  const previousFeedCount = useRef(0);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.feed(user?.id ?? ''),
    queryFn: () => fetchFeed(user!.id),
    enabled: !!user,
  });

  const feedItems = [...(data?.feedItems ?? []), ...extraFeedItems];
  const suggestions = data?.suggestions ?? [];
  const followingCount = data?.followingCount ?? 0;

  // Sync hasMoreFeed from initial data
  useEffect(() => {
    if (data) {
      setHasMoreFeed(data.feedItems.length === 20);
      setExtraFeedItems([]);
    }
  }, [data?.feedItems.length]);

  // Haptic on new feed items after refresh
  useEffect(() => {
    if (data && previousFeedCount.current > 0 && data.feedItems.length > previousFeedCount.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    previousFeedCount.current = data?.feedItems.length ?? 0;
  }, [data?.feedItems.length]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(user.id) });
      }
    }, [user, queryClient])
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const refreshing = isFetching && !!data;

  const loadMoreFeed = useCallback(async () => {
    if (loadingMore || !hasMoreFeed || feedItems.length === 0 || !user) return;
    setLoadingMore(true);
    const lastItem = feedItems[feedItems.length - 1];
    const { data: moreData } = await supabase.rpc('get_activity_feed', {
      p_user_id: user.id,
      p_before: lastItem.event_at,
      p_limit: 20,
    });
    const newItems = (moreData || []) as FeedItem[];
    setExtraFeedItems((prev) => [...prev, ...newItems]);
    setHasMoreFeed(newItems.length === 20);
    setLoadingMore(false);
  }, [loadingMore, hasMoreFeed, feedItems, user]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <HomeSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Text style={{ ...typography.body, color: colors.inkMuted }}>Could not load home</Text>
        <Pressable
          onPress={() => refetch()}
          style={{ paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ ...typography.metaSmall, color: colors.ink }}>Retry</Text>
        </Pressable>
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  };

  const firstName = data?.displayName?.split(' ')[0] ?? null;

  // Sections rendered as header (carousel) and footer (activity)
  const renderHeader = () => (
    <View>
      {/* Greeting + Quick actions */}
      <View style={styles.quickActions}>
        <Text style={styles.greeting}>
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </Text>
        <View style={styles.quickActionButtons}>
          <Pressable style={styles.actionButton} onPress={() => setShowImportMenu(true)}>
            <Text style={styles.actionButtonText}>Import</Text>
          </Pressable>
          <Pressable style={styles.actionButtonPrimary} onPress={() => router.push('/recipe/new')}>
            <Text style={styles.actionButtonPrimaryText}>Create</Text>
          </Pressable>
        </View>
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
                  <RecipePlaceholder id={recipe.id} size={140} style={{ borderTopLeftRadius: radii.image, borderTopRightRadius: radii.image }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  greeting: {
    ...typography.meta,
    color: colors.inkMuted,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: colors.surface,
    borderRadius: radii.image,
    ...shadows.card,
  },
  carouselImage: {
    width: 140,
    height: 140,
    borderTopLeftRadius: radii.image,
    borderTopRightRadius: radii.image,
  },
  carouselCardBody: {
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
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
    paddingHorizontal: 12,
    marginHorizontal: spacing.pagePadding,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    alignItems: 'center',
    ...shadows.card,
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
