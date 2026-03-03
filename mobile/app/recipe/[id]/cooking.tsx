import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { parseSteps } from '@/lib/parse-steps';
import CookingMode from '@/components/ui/CookingMode';
import { colors, spacing, typography } from '@/lib/theme';

interface Recipe {
  id: string;
  title: string;
  instructions: string | null;
}

interface Ingredient {
  id: string;
  quantity: number | null;
  unit: string | null;
  ingredient_name: string;
  notes: string | null;
  order_index: number;
}

export default function CookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [{ data: recipeData, error: recipeError }, { data: ingData }] = await Promise.all([
        supabase.from('recipes').select('id, title, instructions').eq('id', id).single(),
        supabase
          .from('recipe_ingredients')
          .select('id, quantity, unit, ingredient_name, notes, order_index')
          .eq('recipe_id', id)
          .order('order_index'),
      ]);
      if (recipeError || !recipeData) {
        setError('Could not load recipe.');
      } else {
        setRecipe(recipeData);
        setIngredients(ingData ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const steps = useMemo(() => parseSteps(recipe?.instructions ?? ''), [recipe?.instructions]);

  const dismiss = useCallback(() => {
    router.back();
  }, []);

  const handleRatingSubmit = useCallback(async (rating: number, notes: string) => {
    if (!recipe || rating === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('recipe_ratings').insert({
      recipe_id: recipe.id,
      user_id: user.id,
      rating,
      notes: notes || null,
      cooked_date: new Date().toISOString().split('T')[0],
    });
    if (error) {
      Alert.alert('Could not save rating', 'Your cook was logged but the rating could not be saved. Try adding it from the recipe detail.');
    }
  }, [recipe]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Recipe not found.'}</Text>
      </View>
    );
  }

  return (
    <CookingMode
      recipe={recipe}
      ingredients={ingredients}
      steps={steps}
      onDismiss={dismiss}
      onRatingSubmit={handleRatingSubmit}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  errorText: {
    ...typography.body,
    color: colors.inkSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
