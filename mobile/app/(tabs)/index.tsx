import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import { colors, spacing, typography, fontFamily, radii, animation } from '@/lib/theme';
import Avatar from '@/components/ui/Avatar';
import HorizontalCarousel from '@/components/ui/HorizontalCarousel';
import EmptyState from '@/components/ui/EmptyState';
import { ForkDot } from '@/components/ui/Logo';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';

interface CarouselRecipe {
  id: string;
  title: string;
  image_url: string | null;
}

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

export default function HomeScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [recentRecipes, setRecentRecipes] = useState<CarouselRecipe[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreFeed, setHasMoreFeed] = useState(false);
  const previousFeedCount = useRef(0);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) return;

    const [
      { data: profile },
      { data: recent },
      { data: following },
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', user.id)
        .single(),
      supabase
        .from('recipes')
        .select('id, title, image_url')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id),
    ]);

    setDisplayName(profile?.display_name || '');
    setRecentRecipes(recent || []);

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
      case 'created': return ' created ';
      case 'saved': return ' saved ';
      case 'rated': return ' rated ';
      default: return ' ';
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= rating ? 'star' : 'star-o'}
          size={12}
          color={i <= rating ? colors.starFilled : colors.starEmpty}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const handleFeedItemPress = (item: FeedItem) => {
    if (item.event_type === 'saved' && item.source_url) {
      Linking.openURL(item.source_url);
    } else {
      router.push(`/recipe/${item.recipe_id}`);
    }
  };

  const renderFeedItem = ({ item, index }: { item: FeedItem; index: number }) => (
    <Animated.View
      entering={index < animation.staggerMax ? FadeInDown.delay(index * animation.staggerDelay).duration(400) : undefined}
    >
    <TouchableOpacity
      style={styles.feedItem}
      activeOpacity={0.7}
      onPress={() => handleFeedItemPress(item)}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/profile/${item.user_id}`)}
      >
        <Avatar name={item.display_name} size="sm" imageUrl={item.avatar_url} />
      </TouchableOpacity>
      {item.recipe_image_url && (
        <Image
          source={{ uri: item.recipe_image_url }}
          style={styles.feedThumbnail}
          contentFit="cover"
          transition={200}
        />
      )}
      <View style={styles.feedContent}>
        <Text style={styles.feedText} numberOfLines={2}>
          <Text style={styles.feedName}>{item.display_name}</Text>
          {actionVerb(item.event_type)}
          <Text style={styles.feedRecipe}>{item.recipe_title}</Text>
        </Text>
        {item.event_type === 'rated' && item.rating != null && renderStars(item.rating)}
        {item.event_type === 'saved' && item.source_url && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(item.source_url!)}
          >
            <Text style={styles.feedSource}>
              {item.source_name || getDomain(item.source_url)}
            </Text>
          </TouchableOpacity>
        )}
        {item.notes && (
          <Text style={styles.feedNotes} numberOfLines={2}>
            {'\u201C'}{item.notes}{'\u201D'}
          </Text>
        )}
        <Text style={styles.feedTime}>{formatTimeAgo(item.event_at)}</Text>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );

  const renderHeader = () => (
    <View>
      <Animated.Text entering={FadeInDown.duration(400)} style={styles.greeting}>
        {greeting()}, {displayName || 'Chef'}
      </Animated.Text>

      {recentRecipes.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(animation.staggerDelay).duration(400)}>
          <HorizontalCarousel
            title="Recently Updated"
            seeAllLabel="See all"
            onSeeAll={() => router.push('/(tabs)/recipes')}
            items={recentRecipes}
            onItemPress={(id) => router.push(`/recipe/${id}`)}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(animation.staggerDelay).duration(400)}>
          <EmptyState
            icon="book"
            title="No recipes yet"
            subtitle="Import a recipe or create your first one!"
          />
        </Animated.View>
      )}

      {/* Feed section header */}
      <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 2).duration(400)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Chefs</Text>
        </View>

        {followingCount === 0 ? (
          <View style={styles.promptCard}>
            <ForkDot size={20} color="rgba(45,95,93,0.3)" />
            <Text style={styles.promptTitle}>Find Chefs to follow</Text>
            <Text style={styles.promptSubtitle}>
              See what other Chefs are cooking, their favorites, and recommendations
            </Text>
            <TouchableOpacity
              style={styles.promptButton}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <Text style={styles.promptButtonText}>Discover Chefs</Text>
            </TouchableOpacity>
          </View>
        ) : feedItems.length === 0 ? (
          <View style={styles.promptCard}>
            <ForkDot size={20} color="rgba(45,95,93,0.3)" />
            <Text style={styles.promptTitle}>Your Chefs haven't been cooking lately</Text>
            <Text style={styles.promptSubtitle}>
              Why not cook something yourself?
            </Text>
            <TouchableOpacity
              style={styles.promptButton}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/recipes')}
            >
              <Text style={styles.promptButtonText}>My recipes</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );

  const renderFooter = () => (
    <View>
      {loadingMore && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.textMuted} />
        </View>
      )}
      <View style={{ height: spacing.xxxl }} />
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={feedItems.length > 0 ? feedItems : []}
      keyExtractor={(item, i) => `${item.event_type}-${item.recipe_id}-${item.event_at}-${i}`}
      renderItem={renderFeedItem}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      onEndReached={loadMoreFeed}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.textMuted}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.sm,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sectionGap,
    paddingHorizontal: spacing.pagePadding,
  },
  sectionHeader: {
    paddingHorizontal: spacing.pagePadding,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.pagePadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  feedThumbnail: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
  },
  feedContent: {
    flex: 1,
  },
  feedText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  feedName: {
    fontWeight: '600',
    color: colors.text,
  },
  feedRecipe: {
    fontWeight: '500',
    color: colors.text,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  feedSource: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  feedNotes: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  feedTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  promptCard: {
    marginHorizontal: spacing.pagePadding,
    marginBottom: spacing.sectionGap,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accentWashBorder,
    backgroundColor: colors.accentWash,
    padding: spacing.xl,
    alignItems: 'center',
  },
  promptTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  promptSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  promptButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.cta,
    borderRadius: radii.full,
  },
  promptButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
});
