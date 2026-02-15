import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, fontFamily, radii, animation } from '@/lib/theme';
import Avatar from '@/components/ui/Avatar';
import HorizontalCarousel from '@/components/ui/HorizontalCarousel';
import EmptyState from '@/components/ui/EmptyState';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';

interface CarouselRecipe {
  id: string;
  title: string;
  image_url: string | null;
}

interface ActivityItem {
  id: string;
  type: 'cooked' | 'published';
  userName: string;
  userId: string;
  avatarUrl: string | null;
  recipeTitle: string;
  recipeId: string;
  recipeImage: string | null;
  rating?: number;
  timestamp: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [recentRecipes, setRecentRecipes] = useState<CarouselRecipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<CarouselRecipe[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      async function load() {
        const [
          { data: profile },
          { data: recent },
          { data: trending },
          { data: following },
        ] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', user!.id)
            .single(),
          supabase
            .from('recipes')
            .select('id, title, image_url')
            .eq('created_by', user!.id)
            .order('updated_at', { ascending: false })
            .limit(10),
          supabase
            .from('recipes')
            .select('id, title, image_url')
            .eq('visibility', 'public')
            .order('published_at', { ascending: false })
            .limit(10),
          supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user!.id),
        ]);

        setDisplayName(profile?.display_name || '');
        setRecentRecipes(recent || []);
        setTrendingRecipes(trending || []);

        const followedIds = (following || []).map((f) => f.following_id);
        setFollowingCount(followedIds.length);

        // Build friend activity feed
        if (followedIds.length > 0) {
          const [
            { data: cookedActivity },
            { data: publishedActivity },
          ] = await Promise.all([
            // Friends who cooked/rated recipes recently
            supabase
              .from('recipe_ratings')
              .select('id, user_id, recipe_id, rating, created_at')
              .in('user_id', followedIds)
              .order('created_at', { ascending: false })
              .limit(15),
            // Friends who published recipes recently
            supabase
              .from('recipes')
              .select('id, title, image_url, created_by, published_at')
              .eq('visibility', 'public')
              .in('created_by', followedIds)
              .not('published_at', 'is', null)
              .order('published_at', { ascending: false })
              .limit(10),
          ]);

          // Get all user profiles and recipe details we need
          const userIds = new Set<string>();
          const recipeIds = new Set<string>();

          for (const c of cookedActivity || []) {
            userIds.add(c.user_id);
            recipeIds.add(c.recipe_id);
          }
          for (const p of publishedActivity || []) {
            userIds.add(p.created_by);
          }

          const [
            { data: profiles },
            { data: recipeDetails },
          ] = await Promise.all([
            userIds.size > 0
              ? supabase
                  .from('user_profiles')
                  .select('id, display_name, avatar_url')
                  .in('id', Array.from(userIds))
              : { data: [] },
            recipeIds.size > 0
              ? supabase
                  .from('recipes')
                  .select('id, title, image_url')
                  .in('id', Array.from(recipeIds))
              : { data: [] },
          ]);

          const profileMap = new Map(
            (profiles || []).map((p) => [p.id, { name: p.display_name, avatar: p.avatar_url }])
          );
          const recipeMap = new Map(
            (recipeDetails || []).map((r) => [r.id, { title: r.title, image: r.image_url }])
          );

          const items: ActivityItem[] = [];

          for (const c of cookedActivity || []) {
            const prof = profileMap.get(c.user_id);
            const recipe = recipeMap.get(c.recipe_id);
            if (prof && recipe) {
              items.push({
                id: `cooked-${c.id}`,
                type: 'cooked',
                userName: prof.name,
                userId: c.user_id,
                avatarUrl: prof.avatar,
                recipeTitle: recipe.title,
                recipeId: c.recipe_id,
                recipeImage: recipe.image,
                rating: c.rating,
                timestamp: c.created_at,
              });
            }
          }

          for (const p of publishedActivity || []) {
            const prof = profileMap.get(p.created_by);
            if (prof) {
              items.push({
                id: `published-${p.id}`,
                type: 'published',
                userName: prof.name,
                userId: p.created_by,
                avatarUrl: prof.avatar,
                recipeTitle: p.title,
                recipeId: p.id,
                recipeImage: p.image_url,
                timestamp: p.published_at!,
              });
            }
          }

          // Sort by timestamp descending
          items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          setActivity(items.slice(0, 20));
        } else {
          setActivity([]);
        }

        setLoading(false);
      }

      load();
    }, [user])
  );

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

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={i <= rating ? styles.starFilled : styles.starEmpty}>
          {'\u2605'}
        </Text>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            lottie="empty-recipes"
            title="No recipes yet"
            subtitle="Import a recipe or create your first one!"
          />
        </Animated.View>
      )}

      {/* Friend Activity Feed */}
      <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 2).duration(400)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friend Activity</Text>
        </View>

        {activity.length > 0 ? (
          <View style={styles.activityList}>
            {activity.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.activityItem}
                activeOpacity={0.7}
                onPress={() => router.push(`/recipe/${item.recipeId}`)}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/profile/${item.userId}`);
                  }}
                >
                  <Avatar name={item.userName} size="sm" imageUrl={item.avatarUrl} />
                </TouchableOpacity>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText} numberOfLines={2}>
                    <Text style={styles.activityName}>{item.userName}</Text>
                    {item.type === 'cooked' ? ' cooked ' : ' published '}
                    <Text style={styles.activityRecipe}>{item.recipeTitle}</Text>
                  </Text>
                  <View style={styles.activityMeta}>
                    {item.type === 'cooked' && item.rating && renderStars(item.rating)}
                    <Text style={styles.activityTime}>{formatTimeAgo(item.timestamp)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : followingCount === 0 ? (
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>See what friends are cooking</Text>
            <Text style={styles.promptSubtitle}>
              Follow people to see their cooking activity here.
            </Text>
            <TouchableOpacity
              style={styles.promptButton}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <Text style={styles.promptButtonText}>Discover recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>No recent activity</Text>
            <Text style={styles.promptSubtitle}>
              Your friends haven't cooked or published anything recently.
            </Text>
          </View>
        )}
      </Animated.View>

      {trendingRecipes.length > 0 && (
        <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 3).duration(400)}>
          <HorizontalCarousel
            title="Discover"
            seeAllLabel="Browse"
            onSeeAll={() => router.push('/(tabs)/discover')}
            items={trendingRecipes}
            onItemPress={(id) => router.push(`/recipe/${id}`)}
          />
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  greeting: {
    fontFamily: fontFamily.serifSemiBold,
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.serifSemiBold,
    fontSize: 18,
    color: colors.text,
  },
  activityList: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  activityName: {
    fontWeight: '600',
    color: colors.text,
  },
  activityRecipe: {
    fontWeight: '500',
    color: colors.text,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  starFilled: {
    fontSize: 12,
    color: colors.starFilled,
  },
  starEmpty: {
    fontSize: 12,
    color: colors.border,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  promptCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  promptTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
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
    borderRadius: radii.md,
  },
  promptButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
});
