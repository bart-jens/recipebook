import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, radii, shadows } from '@/lib/theme';
import Card from '@/components/ui/Card';

interface RecentRecipe {
  id: string;
  title: string;
  updated_at: string;
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
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      async function load() {
        const [{ data: profile }, { data: recipes }, { data: ratings }] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', user!.id)
            .single(),
          supabase
            .from('recipes')
            .select('id, title, updated_at, is_favorite')
            .eq('created_by', user!.id)
            .order('updated_at', { ascending: false })
            .limit(5),
          supabase
            .from('recipe_ratings')
            .select('id')
            .eq('user_id', user!.id),
        ]);

        setDisplayName(profile?.display_name || '');
        const allRecipes = recipes || [];
        setStats({
          totalRecipes: allRecipes.length,
          favorites: allRecipes.filter((r) => r.is_favorite).length,
          timeCooked: (ratings || []).length,
        });
        setRecentRecipes(allRecipes.slice(0, 5));
        setLoading(false);
      }

      load();
    }, [user])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      <Text style={styles.greeting}>
        {greeting()}, {displayName || 'Chef'}
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalRecipes}</Text>
          <Text style={styles.statLabel}>recipes</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>favorites</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.timeCooked}</Text>
          <Text style={styles.statLabel}>times cooked</Text>
        </Card>
      </View>

      {/* Recent recipes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Updated</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/recipes')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentRecipes.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No recipes yet. Import one from the web app!</Text>
          </View>
        ) : (
          recentRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              style={styles.recentCard}
              onPress={() => router.push(`/recipe/${recipe.id}`)}
            >
              <Text style={styles.recentTitle}>{recipe.title}</Text>
              <Text style={styles.recentDate}>
                {new Date(recipe.updated_at).toLocaleDateString()}
              </Text>
            </Card>
          ))
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <FontAwesome name="search" size={22} color={colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/recipes')}
          >
            <FontAwesome name="book" size={22} color={colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionLabel}>My Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <FontAwesome name="user" size={22} color={colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
  },
  greeting: {
    ...typography.h1,
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.xl,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radii.lg,
  } as ViewStyle,
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

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },

  // Recent recipes
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  } as ViewStyle,
  recentTitle: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  recentDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },

  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows,
  } as ViewStyle,
  actionIcon: {
    marginBottom: spacing.sm - 2,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
