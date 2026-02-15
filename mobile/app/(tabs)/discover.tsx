import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radii } from '@/lib/theme';
import RecipeCard from '@/components/ui/RecipeCard';
import EmptyState from '@/components/ui/EmptyState';
import RecipeListSkeleton from '@/components/skeletons/RecipeListSkeleton';

type SortOption = 'newest' | 'rating' | 'popular';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Forked' },
];

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
  forkCount: number;
  tags: string[];
}

export default function DiscoverScreen() {
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('recipes')
      .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by, recipe_tags(tag)')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: recipeData } = await query;
    if (!recipeData || recipeData.length === 0) {
      setRecipes([]);
      setAllTags([]);
      setLoading(false);
      return;
    }

    // Collect all unique tags
    const tagSet = new Set<string>();
    for (const r of recipeData) {
      for (const t of (r as any).recipe_tags || []) {
        tagSet.add(t.tag);
      }
    }
    setAllTags(Array.from(tagSet).sort());

    // Filter by tag if selected
    let filtered = recipeData;
    if (selectedTag) {
      filtered = recipeData.filter((r) =>
        ((r as any).recipe_tags || []).some((t: { tag: string }) => t.tag === selectedTag)
      );
    }

    // Batch fetch creator names
    const creatorIds = Array.from(new Set(filtered.map((r) => r.created_by)));
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', creatorIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

    // Batch fetch ratings
    const recipeIds = filtered.map((r) => r.id);
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

    // Batch fetch fork counts
    const { data: forks } = recipeIds.length > 0
      ? await supabase
          .from('recipes')
          .select('forked_from_id')
          .in('forked_from_id', recipeIds)
      : { data: [] };
    const forkCounts = new Map<string, number>();
    for (const f of forks || []) {
      if (f.forked_from_id) {
        forkCounts.set(f.forked_from_id, (forkCounts.get(f.forked_from_id) || 0) + 1);
      }
    }

    const enriched: DiscoverRecipe[] = filtered.map((r) => {
      const ratingInfo = ratingMap.get(r.id);
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        image_url: r.image_url,
        prep_time_minutes: r.prep_time_minutes,
        cook_time_minutes: r.cook_time_minutes,
        created_by: r.created_by,
        creatorName: profileMap.get(r.created_by) || 'Unknown',
        avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : null,
        ratingCount: ratingInfo?.count || 0,
        forkCount: forkCounts.get(r.id) || 0,
        tags: ((r as any).recipe_tags || []).map((t: { tag: string }) => t.tag),
      };
    });

    // Client-side sort
    if (sort === 'rating') {
      enriched.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sort === 'popular') {
      enriched.sort((a, b) => b.forkCount - a.forkCount);
    }

    setRecipes(enriched);
    setLoading(false);
  }, [search, sort, selectedTag]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  return (
    <View style={styles.container}>
      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
        >
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortPill, sort === opt.value && styles.sortPillActive]}
              onPress={() => setSort(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortPillText, sort === opt.value && styles.sortPillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {allTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagRow}
          >
            {selectedTag && (
              <TouchableOpacity
                style={styles.clearTagPill}
                onPress={() => setSelectedTag(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.clearTagText}>Clear</Text>
              </TouchableOpacity>
            )}
            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagPill, selectedTag === tag && styles.tagPillActive]}
                onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagPillText, selectedTag === tag && styles.tagPillTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
  controlsContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
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
  sortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingRight: spacing.lg,
  },
  sortPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  sortPillActive: {
    backgroundColor: colors.primary,
  },
  sortPillText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortPillTextActive: {
    color: colors.white,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingRight: spacing.lg,
  },
  tagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tagPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tagPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tagPillTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  clearTagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.xl,
  },
  clearTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
});
