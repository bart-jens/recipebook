import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radii } from '@/lib/theme';
import RecipeCard from '@/components/ui/RecipeCard';
import EmptyState from '@/components/ui/EmptyState';
import RecipeListSkeleton from '@/components/skeletons/RecipeListSkeleton';

interface DiscoverRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
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
      .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by')
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
        <RecipeListSkeleton />
      ) : recipes.length === 0 ? (
        <EmptyState
          lottie={search ? 'no-results' : 'empty-state'}
          title={search ? 'No results' : 'No published recipes yet'}
          subtitle={
            search
              ? `No recipes match "${search}"`
              : 'Be the first to publish a recipe!'
          }
        />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}`)}
            />
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
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
});
