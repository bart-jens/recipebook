import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radii, shadows } from '@/lib/theme';
import Card from '@/components/ui/Card';
import StarRating from '@/components/ui/StarRating';

interface DiscoverRecipe {
  id: string;
  title: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  created_by: string;
  creatorName: string;
  avgRating: number | null;
  ratingCount: number;
}

export default function DiscoverScreen() {
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRecipes = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('recipes')
      .select('id, title, description, prep_time_minutes, cook_time_minutes, created_by')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: recipeData } = await query;
    if (!recipeData || recipeData.length === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // Batch fetch creator names
    const creatorIds = Array.from(new Set(recipeData.map((r) => r.created_by)));
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', creatorIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

    // Batch fetch ratings
    const recipeIds = recipeData.map((r) => r.id);
    const { data: ratings } = await supabase
      .from('recipe_ratings')
      .select('recipe_id, rating')
      .in('recipe_id', recipeIds);

    const ratingMap = new Map<string, { total: number; count: number }>();
    for (const r of ratings || []) {
      const existing = ratingMap.get(r.recipe_id) || { total: 0, count: 0 };
      existing.total += r.rating;
      existing.count += 1;
      ratingMap.set(r.recipe_id, existing);
    }

    const enriched: DiscoverRecipe[] = recipeData.map((r) => {
      const ratingInfo = ratingMap.get(r.id);
      return {
        ...r,
        creatorName: profileMap.get(r.created_by) || 'Unknown',
        avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : null,
        ratingCount: ratingInfo?.count || 0,
      };
    });

    setRecipes(enriched);
    setLoading(false);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  const ItemSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {search ? 'No results' : 'No published recipes yet'}
          </Text>
          <Text style={styles.emptyText}>
            {search
              ? `No recipes match "${search}"`
              : 'Be the first to publish a recipe!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ItemSeparator}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() => router.push(`/recipe/${item.id}`)}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/profile/${item.created_by}`)}
              >
                <Text style={styles.creatorName}>by {item.creatorName}</Text>
              </TouchableOpacity>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <View style={styles.cardFooter}>
                {item.avgRating !== null && (
                  <View style={styles.ratingRow}>
                    <StarRating rating={item.avgRating} size={14} />
                    <Text style={styles.ratingCount}>({item.ratingCount})</Text>
                  </View>
                )}
                {(item.prep_time_minutes || item.cook_time_minutes) && (
                  <Text style={styles.cardMeta}>
                    {[
                      item.prep_time_minutes && `${item.prep_time_minutes} min prep`,
                      item.cook_time_minutes && `${item.cook_time_minutes} min cook`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                )}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  card: {
    // Card already provides padding, bg, border-radius, and shadow
  } as ViewStyle,
  cardTitle: {
    ...typography.h3,
    color: colors.text,
  },
  creatorName: {
    ...typography.label,
    color: colors.primary,
    marginTop: 2,
  },
  cardDesc: {
    marginTop: spacing.sm - 2,
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardFooter: {
    marginTop: spacing.sm + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
