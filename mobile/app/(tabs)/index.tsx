import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, fontFamily, animation } from '@/lib/theme';
import AnimatedCard from '@/components/ui/AnimatedCard';
import HorizontalCarousel from '@/components/ui/HorizontalCarousel';
import EmptyState from '@/components/ui/EmptyState';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';

interface CarouselRecipe {
  id: string;
  title: string;
  image_url: string | null;
}

interface Stats {
  totalRecipes: number;
  favorites: number;
  timeCooked: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [stats, setStats] = useState<Stats>({ totalRecipes: 0, favorites: 0, timeCooked: 0 });
  const [recentRecipes, setRecentRecipes] = useState<CarouselRecipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<CarouselRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      async function load() {
        const [
          { data: profile },
          { data: recent },
          { count: recipeCount },
          { count: favoriteCount },
          { count: cookedCount },
          { data: trending },
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
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user!.id),
          supabase
            .from('recipes')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user!.id)
            .eq('is_favorite', true),
          supabase
            .from('recipe_ratings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user!.id),
          supabase
            .from('recipes')
            .select('id, title, image_url')
            .eq('visibility', 'public')
            .order('published_at', { ascending: false })
            .limit(10),
        ]);

        setDisplayName(profile?.display_name || '');
        setRecentRecipes(recent || []);
        setTrendingRecipes(trending || []);
        setStats({
          totalRecipes: recipeCount || 0,
          favorites: favoriteCount || 0,
          timeCooked: cookedCount || 0,
        });
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.Text entering={FadeInDown.duration(400)} style={styles.greeting}>
        {greeting()}, {displayName || 'Chef'}
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(animation.staggerDelay).duration(400)}
        style={styles.statsRow}
      >
        <AnimatedCard style={styles.statCard} onPress={() => router.push('/(tabs)/recipes')}>
          <Text style={styles.statNumber}>{stats.totalRecipes}</Text>
          <Text style={styles.statLabel}>recipes</Text>
        </AnimatedCard>
        <AnimatedCard style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>favorites</Text>
        </AnimatedCard>
        <AnimatedCard style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.timeCooked}</Text>
          <Text style={styles.statLabel}>times cooked</Text>
        </AnimatedCard>
      </Animated.View>

      {recentRecipes.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 2).duration(400)}>
          <HorizontalCarousel
            title="Recently Updated"
            seeAllLabel="See all"
            onSeeAll={() => router.push('/(tabs)/recipes')}
            items={recentRecipes}
            onItemPress={(id) => router.push(`/recipe/${id}`)}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 2).duration(400)}>
          <EmptyState
            lottie="empty-recipes"
            title="No recipes yet"
            subtitle="Import a recipe or create your first one!"
          />
        </Animated.View>
      )}

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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
