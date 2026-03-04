import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  visibility: string;
  source_type: string;
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
        supabase.from('recipes').select('id, title, instructions, visibility, source_type').eq('id', id).single(),
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

  const nudgePending = useRef(false);

  const dismiss = useCallback(() => {
    if (nudgePending.current) return;
    router.back();
  }, []);

  const showPublishNudge = useCallback(() => {
    if (!recipe) return;
    nudgePending.current = true;
    Alert.alert(
      'Share with the community?',
      'This recipe is private. Publish it so your followers can see your cooking activity.',
      [
        {
          text: 'Publish',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase
              .from('recipes')
              .update({ visibility: 'public', published_at: new Date().toISOString() })
              .eq('id', recipe.id)
              .eq('created_by', user.id);
            nudgePending.current = false;
            router.back();
          },
        },
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => { nudgePending.current = false; router.back(); },
        },
      ],
    );
  }, [recipe]);

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
    const isPrivateManual = recipe.visibility === 'private' && recipe.source_type === 'manual';
    if (isPrivateManual) {
      showPublishNudge();
    }
    // If not private+manual, CookingMode will call onDismiss after this resolves
  }, [recipe, showPublishNudge]);

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
