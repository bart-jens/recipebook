import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, radii } from '@/lib/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  is_favorite: boolean;
  visibility: string;
  avgRating: number | null;
  ratingCount: number;
}

export default function RecipesScreen() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('recipes')
      .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, is_favorite, visibility')
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data } = await query;
    const recipeList = data || [];

    // Batch fetch ratings for all recipes
    let ratingMap = new Map<string, { total: number; count: number }>();
    if (recipeList.length > 0) {
      const { data: ratings } = await supabase
        .from('recipe_ratings')
        .select('recipe_id, rating')
        .in('recipe_id', recipeList.map((r) => r.id));

      for (const r of ratings || []) {
        const existing = ratingMap.get(r.recipe_id) || { total: 0, count: 0 };
        existing.total += r.rating;
        existing.count += 1;
        ratingMap.set(r.recipe_id, existing);
      }
    }

    const enriched: Recipe[] = recipeList.map((r) => {
      const ratingInfo = ratingMap.get(r.id);
      return {
        ...r,
        avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : null,
        ratingCount: ratingInfo?.count || 0,
      };
    });

    // Sort favorites first
    enriched.sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      return 0;
    });

    setRecipes(enriched);
    setLoading(false);
  }, [user, search]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your recipes..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <View style={styles.actionRow}>
          {recipes.length > 0 && !loading && (
            <Text style={styles.count}>
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
              {search ? ` for "${search}"` : ''}
            </Text>
          )}
          <View style={styles.actionButtons}>
            <Button
              title="Import URL"
              variant="secondary"
              size="sm"
              onPress={() => router.push('/recipe/import-url')}
            />
            <Button
              title="+ New"
              variant="primary"
              size="sm"
              onPress={() => router.push('/recipe/new')}
            />
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {search ? 'No results' : 'No recipes yet'}
          </Text>
          <Text style={styles.emptyText}>
            {search
              ? `No recipes match "${search}"`
              : 'Import a recipe from the web app to get started.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/recipe/${item.id}`)} style={styles.recipeCard}>
              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={200}
                />
              )}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.badges}>
                  {item.is_favorite && (
                    <FontAwesome name="heart" size={16} color={colors.dangerLight} />
                  )}
                  {item.visibility === 'public' && (
                    <Badge label="Public" variant="success" />
                  )}
                </View>
              </View>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <View style={styles.cardFooter}>
                {item.avgRating !== null && (
                  <View style={styles.ratingRow}>
                    <StarRating rating={item.avgRating} size={14} />
                    <Text style={styles.ratingText}>
                      {item.avgRating.toFixed(1)} ({item.ratingCount})
                    </Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: { padding: spacing.lg, paddingBottom: 0 },
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm + 2,
  },
  count: { ...typography.label, color: colors.textSecondary },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  empty: { alignItems: 'center', paddingTop: 60 },
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
  recipeCard: {
    overflow: 'hidden',
  } as ViewStyle,
  cardImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: { ...typography.h3, color: colors.text, flex: 1 },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    marginLeft: spacing.sm,
  },
  cardDesc: {
    marginTop: spacing.xs,
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardFooter: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingText: { ...typography.caption, color: colors.textSecondary },
  cardMeta: { ...typography.caption, color: colors.textMuted },
});
