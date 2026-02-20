import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, fontFamily, animation } from '@/lib/theme';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';

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

export default function HomeScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
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

    const [
      { data: profile },
      { data: following },
      { data: favorites },
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
        .from('recipe_favorites')
        .select(`recipe_id, recipes(${recipeSelectFields})`)
        .eq('user_id', user.id)
        .limit(10),
      supabase
        .from('cook_log')
        .select('id, cooked_at, recipes(id, title)')
        .eq('user_id', user.id)
        .order('cooked_at', { ascending: false })
        .limit(3),
    ]);

    setDisplayName(profile?.display_name || '');
    setRecentCooks((cooks || []) as unknown as RecentCook[]);

    // Suggestions: favorites first, fall back to recent recipes
    const favRecipes = (favorites || [])
      .map((f: any) => f.recipes)
      .filter(Boolean) as SuggestionRecipe[];

    if (favRecipes.length > 0) {
      setSuggestions(favRecipes);
    } else {
      const { data: recent } = await supabase
        .from('recipes')
        .select(recipeSelectFields)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);
      setSuggestions((recent || []) as SuggestionRecipe[]);
    }

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

    setLoading(false);
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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
      case 'saved': return ' saved ';
      case 'rated': return ' rated ';
      default: return ' ';
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
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

  const handleFeedItemPress = (item: FeedItem) => {
    if (item.event_type === 'saved' && item.source_url) {
      Linking.openURL(item.source_url);
    } else {
      router.push(`/recipe/${item.recipe_id}`);
    }
  };

  // Derive featured recipe (first with an image) and remaining recipes
  const featuredRecipe = suggestions.find((r) => r.image_url) || suggestions[0] || null;
  const indexRecipes = suggestions.filter((r) => r !== featuredRecipe);

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

  // Sections rendered as header (masthead, featured, index) and footer (activity)
  const renderHeader = () => (
    <View>
      {/* 1. Compact Masthead */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.masthead}>
        <Text style={styles.mastheadGreeting}>
          {greeting()}, {displayName || 'Chef'}
        </Text>
        <Text style={styles.mastheadDate}>{formatDate()}</Text>
      </Animated.View>

      {/* 2. Thick Rule */}
      <Animated.View entering={FadeInDown.delay(animation.staggerDelay).duration(400)}>
        <View style={styles.ruleThick} />
      </Animated.View>

      {/* 3. Featured Recipe */}
      {featuredRecipe && (
        <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 2).duration(400)}>
          <Pressable
            style={styles.featured}
            onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
          >
            <Text style={styles.featuredLabel}>FEATURED</Text>
            <View style={styles.featuredLayout}>
              <View style={styles.featuredText}>
                {getTag(featuredRecipe) && (
                  <Text style={styles.featuredCategory}>{getTag(featuredRecipe)!.toUpperCase()}</Text>
                )}
                <Text style={styles.featuredTitle} numberOfLines={3}>
                  {featuredRecipe.title}
                </Text>
                {featuredRecipe.description && (
                  <Text style={styles.featuredExcerpt} numberOfLines={2}>
                    {featuredRecipe.description}
                  </Text>
                )}
                <View style={styles.featuredMeta}>
                  {displayName ? <Text style={styles.featuredMetaText}>By {displayName}</Text> : null}
                  {featuredRecipe.cook_time_minutes ? (
                    <>
                      <View style={styles.metaDot} />
                      <Text style={styles.featuredMetaText}>
                        {formatTime(featuredRecipe.cook_time_minutes)}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
              {featuredRecipe.image_url ? (
                <Image
                  source={{ uri: featuredRecipe.image_url }}
                  style={styles.featuredImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.featuredImage, { backgroundColor: colors.surfaceAlt }]} />
              )}
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* 4. Thin Rule */}
      <View style={styles.ruleThin} />

      {/* 5. Numbered Recipe Index */}
      {indexRecipes.length > 0 && (
        <View style={styles.indexSection}>
          <Animated.View
            entering={FadeInDown.delay(animation.staggerDelay * 3).duration(400)}
            style={styles.indexHeader}
          >
            <Text style={styles.indexTitle}>Your Recipes</Text>
            <Text style={styles.indexCount}>{suggestions.length} total</Text>
          </Animated.View>
          {indexRecipes.map((recipe, idx) => (
            <Animated.View
              key={recipe.id}
              entering={
                idx < animation.staggerMax
                  ? FadeInDown.delay(animation.staggerDelay * (4 + idx)).duration(400)
                  : undefined
              }
            >
              <Pressable
                style={styles.indexItem}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              >
                <Text style={styles.indexNumber}>{idx + 1}</Text>
                <View style={styles.indexContent}>
                  {getTag(recipe) && (
                    <Text style={styles.indexCategory}>{getTag(recipe)!.toUpperCase()}</Text>
                  )}
                  <Text style={styles.indexItemTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  <View style={styles.indexItemMeta}>
                    {recipe.cook_time_minutes ? (
                      <Text style={styles.indexMetaText}>
                        {formatTime(recipe.cook_time_minutes)}
                      </Text>
                    ) : recipe.prep_time_minutes ? (
                      <Text style={styles.indexMetaText}>
                        {formatTime(recipe.prep_time_minutes)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {recipe.image_url && (
                  <Image
                    source={{ uri: recipe.image_url }}
                    style={styles.indexThumb}
                    contentFit="cover"
                    transition={200}
                  />
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Thin Rule before activity */}
      <View style={[styles.ruleThin, { marginTop: 12 }]} />

      {/* 6. Activity Ticker Header */}
      {feedItems.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(animation.staggerDelay * 6).duration(400)}
          style={styles.tickerHeader}
        >
          <Text style={styles.tickerTitle}>Activity</Text>
        </Animated.View>
      ) : followingCount === 0 ? (
        <Animated.View
          entering={FadeInDown.delay(animation.staggerDelay * 4).duration(400)}
          style={styles.promptSection}
        >
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
        </Animated.View>
      ) : feedItems.length === 0 ? (
        <Animated.View
          entering={FadeInDown.delay(animation.staggerDelay * 4).duration(400)}
          style={styles.promptSection}
        >
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
        </Animated.View>
      ) : null}
    </View>
  );

  const renderTickerItem = ({ item, index }: { item: FeedItem; index: number }) => (
    <Animated.View
      entering={
        index < animation.staggerMax
          ? FadeInDown.delay(index * animation.staggerDelay).duration(400)
          : undefined
      }
    >
      <Pressable
        style={styles.tickerItem}
        onPress={() => handleFeedItemPress(item)}
      >
        {item.recipe_image_url ? (
          <Image
            source={{ uri: item.recipe_image_url }}
            style={styles.tickerThumb}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.tickerThumb, { backgroundColor: colors.surfaceAlt }]} />
        )}
        <View style={styles.tickerBody}>
          <Text style={styles.tickerText} numberOfLines={2}>
            <Text style={styles.tickerName}>{item.display_name}</Text>
            {actionVerb(item.event_type)}
            <Text style={styles.tickerRecipe}>{item.recipe_title}</Text>
          </Text>
          {item.event_type === 'rated' && item.rating != null && renderStars(item.rating)}
        </View>
        <Text style={styles.tickerTime}>{formatTimeAgo(item.event_at)}</Text>
      </Pressable>
    </Animated.View>
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
    <FlatList
      style={styles.container}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // 1. Compact Masthead
  masthead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mastheadGreeting: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 15,
    color: colors.inkSecondary,
  },
  mastheadDate: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    color: colors.inkMuted,
  },

  // 2. Thick Rule
  ruleThick: {
    height: 3,
    backgroundColor: colors.ink,
  },

  // 3. Featured Recipe
  featured: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  featuredLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.inkMuted,
    marginBottom: 10,
  },
  featuredLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  featuredText: {
    flex: 1,
  },
  featuredCategory: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    color: colors.accent,
    marginBottom: 4,
  },
  featuredTitle: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.8,
    color: colors.ink,
    marginBottom: 8,
  },
  featuredExcerpt: {
    fontFamily: fontFamily.sansLight,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSecondary,
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featuredMetaText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: colors.inkMuted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
  featuredImage: {
    width: 130,
    height: 170,
    borderRadius: 0,
  },

  // 4. Thin Rule
  ruleThin: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },

  // 5. Numbered Recipe Index
  indexSection: {
    paddingHorizontal: 20,
  },
  indexHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
  },
  indexTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  indexCount: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: colors.inkMuted,
  },
  indexItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  indexNumber: {
    fontFamily: fontFamily.display,
    fontSize: 32,
    lineHeight: 32,
    color: colors.border,
    minWidth: 28,
    paddingTop: 2,
  },
  indexContent: {
    flex: 1,
    minWidth: 0,
  },
  indexCategory: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    color: colors.accent,
    marginBottom: 1,
  },
  indexItemTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 23,
    letterSpacing: -0.4,
    color: colors.ink,
    marginBottom: 3,
  },
  indexItemMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  indexMetaText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: colors.inkMuted,
  },
  indexThumb: {
    width: 56,
    height: 56,
    borderRadius: 0,
    alignSelf: 'center',
  },

  // 6. Activity Ticker
  tickerHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tickerTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    letterSpacing: -0.4,
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
  tickerThumb: {
    width: 36,
    height: 36,
    borderRadius: 0,
  },
  tickerBody: {
    flex: 1,
    minWidth: 0,
  },
  tickerText: {
    fontFamily: fontFamily.sansLight,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  tickerName: {
    fontFamily: fontFamily.sansBold,
    fontSize: 13,
  },
  tickerRecipe: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 13,
    color: colors.accent,
  },
  tickerTime: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
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
    fontFamily: fontFamily.sansLight,
    fontSize: 14,
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
    fontFamily: fontFamily.monoMedium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.bg,
  },
});
