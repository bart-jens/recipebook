import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, radii, animation } from '@/lib/theme';
import RecipeCard from '@/components/ui/RecipeCard';
import EmptyState from '@/components/ui/EmptyState';

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  visibility: string;
  avgRating: number | null;
  ratingCount: number;
  tags: string[];
}

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCollection = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);

    const { data: collection } = await supabase
      .from('collections')
      .select('name, description')
      .eq('id', id)
      .single();

    if (collection) {
      setCollectionName(collection.name);
      setCollectionDesc(collection.description);
    }

    const { data: memberships } = await supabase
      .from('collection_recipes')
      .select('recipe_id')
      .eq('collection_id', id)
      .order('added_at', { ascending: false });

    if (!memberships || memberships.length === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    const recipeIds = memberships.map((m: { recipe_id: string }) => m.recipe_id);
    const { data: recipeData } = await supabase
      .from('recipes')
      .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, visibility, recipe_tags(tag)')
      .in('id', recipeIds);

    // Batch ratings
    const { data: ratingsData } = await supabase
      .from('recipe_ratings')
      .select('recipe_id, rating')
      .in('recipe_id', recipeIds);

    const ratingMap = new Map<string, { total: number; count: number }>();
    for (const r of ratingsData || []) {
      const existing = ratingMap.get(r.recipe_id) || { total: 0, count: 0 };
      existing.total += r.rating;
      existing.count += 1;
      ratingMap.set(r.recipe_id, existing);
    }

    const enriched: Recipe[] = (recipeData || []).map((r: any) => {
      const ratingInfo = ratingMap.get(r.id);
      return {
        ...r,
        avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : null,
        ratingCount: ratingInfo?.count || 0,
        tags: ((r as any).recipe_tags || []).map((t: { tag: string }) => t.tag),
      };
    });

    // Preserve order from collection_recipes
    const orderMap = new Map(recipeIds.map((rid: string, i: number) => [rid, i]));
    enriched.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));

    setRecipes(enriched);
    setLoading(false);
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      fetchCollection();
    }, [fetchCollection])
  );

  const handleRemove = (recipeId: string, title: string) => {
    Alert.alert('Remove from collection', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await supabase
            .from('collection_recipes')
            .delete()
            .eq('collection_id', id)
            .eq('recipe_id', recipeId);
          setRecipes(recipes.filter((r) => r.id !== recipeId));
        },
      },
    ]);
  };

  const filtered = search
    ? recipes.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: collectionName || 'Collection' }} />

      <View style={styles.header}>
        {collectionDesc && (
          <Text style={styles.description}>{collectionDesc}</Text>
        )}
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}>
            <Text style={styles.addLink}>Add from recipes</Text>
          </TouchableOpacity>
        </View>
        {recipes.length > 3 && (
          <TextInput
            style={styles.searchInput}
            placeholder="Search in collection..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="book"
          title={search ? 'No results' : 'No recipes yet'}
          subtitle={search ? `No recipes match "${search}"` : 'Add recipes from their detail pages'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={index < animation.staggerMax ? FadeInDown.delay(index * animation.staggerDelay).duration(400) : undefined}
            >
              <RecipeCard
                recipe={item}
                onPress={() => router.push(`/recipe/${item.id}`)}
                onLongPress={() => handleRemove(item.id, item.title)}
              />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.pagePadding, paddingBottom: spacing.sm },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  count: {
    ...typography.label,
    color: colors.textSecondary,
  },
  addLink: {
    ...typography.label,
    color: colors.primary,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
