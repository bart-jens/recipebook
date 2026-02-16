import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing, typography, radii } from '@/lib/theme';
import Button from '@/components/ui/Button';
import RecipeCard from '@/components/ui/RecipeCard';
import EmptyState from '@/components/ui/EmptyState';
import RecipeListSkeleton from '@/components/skeletons/RecipeListSkeleton';

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
  const [showImportMenu, setShowImportMenu] = useState(false);

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
              title="Import"
              variant="secondary"
              size="sm"
              onPress={() => setShowImportMenu(true)}
            />
            <Button
              title="Create My Own"
              variant="primary"
              size="sm"
              onPress={() => router.push('/recipe/new')}
            />
          </View>
        </View>
      </View>

      {loading ? (
        <RecipeListSkeleton />
      ) : recipes.length === 0 ? (
        <EmptyState
          lottie={search ? 'no-results' : 'empty-recipes'}
          title={search ? 'No results' : 'No recipes yet'}
          subtitle={
            search
              ? `No recipes match "${search}"`
              : 'Import a recipe or create your first one!'
          }
        />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}`)}
            />
          )}
        />
      )}

      <Modal
        visible={showImportMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowImportMenu(false)}>
          <View style={styles.importMenu}>
            <Text style={styles.importMenuTitle}>Import Recipe</Text>
            <TouchableOpacity
              style={styles.importOption}
              activeOpacity={0.7}
              onPress={() => { setShowImportMenu(false); router.push('/recipe/import-url'); }}
            >
              <FontAwesome name="link" size={18} color={colors.primary} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>From Link</Text>
                <Text style={styles.importOptionDesc}>Paste a link from any recipe site or Instagram</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.importOption}
              activeOpacity={0.7}
              onPress={() => { setShowImportMenu(false); router.push('/recipe/import-photo'); }}
            >
              <FontAwesome name="camera" size={18} color={colors.primary} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>From Photo</Text>
                <Text style={styles.importOptionDesc}>Scan a photo of a recipe with AI</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  importMenu: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  importMenuTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  importOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    gap: spacing.lg,
  },
  importOptionText: { flex: 1 },
  importOptionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  importOptionDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
