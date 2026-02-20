import { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import RecipeForm, { RecipeFormData } from '@/components/RecipeForm';
import { colors } from '@/lib/theme';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<RecipeFormData | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [{ data: recipe }, { data: ingredients }] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', id).single(),
        supabase
          .from('recipe_ingredients')
          .select('ingredient_name, quantity, unit, notes, order_index')
          .eq('recipe_id', id!)
          .order('order_index'),
      ]);

      if (!recipe) {
        Alert.alert('Error', 'Recipe not found');
        router.back();
        return;
      }

      setSourceName(recipe.source_name || '');
      setInitialData({
        title: recipe.title || '',
        description: recipe.description || '',
        instructions: recipe.instructions || '',
        prep_time_minutes: recipe.prep_time_minutes?.toString() || '',
        cook_time_minutes: recipe.cook_time_minutes?.toString() || '',
        servings: recipe.servings?.toString() || '',
        ingredients: (ingredients || []).length > 0
          ? (ingredients || []).map((ing) => ({
              ingredient_name: ing.ingredient_name,
              quantity: ing.quantity?.toString() || '',
              unit: ing.unit || '',
              notes: ing.notes || '',
            }))
          : [{ ingredient_name: '', quantity: '', unit: '', notes: '' }],
      });
      setLoading(false);
    }

    load();
  }, [id]);

  const handleSubmit = async (data: RecipeFormData) => {
    if (!id || !user) return;
    setSaving(true);

    const { error } = await supabase
      .from('recipes')
      .update({
        title: data.title.trim(),
        description: data.description.trim() || null,
        instructions: data.instructions.trim() || null,
        prep_time_minutes: data.prep_time_minutes ? parseInt(data.prep_time_minutes) : null,
        cook_time_minutes: data.cook_time_minutes ? parseInt(data.cook_time_minutes) : null,
        servings: data.servings ? parseInt(data.servings) : null,
        source_name: sourceName.trim() || null,
      })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', 'Could not update recipe');
      setSaving(false);
      return;
    }

    // Delete existing ingredients and re-insert
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);

    const validIngredients = data.ingredients.filter((ing) => ing.ingredient_name.trim());
    if (validIngredients.length > 0) {
      await supabase.from('recipe_ingredients').insert(
        validIngredients.map((ing, i) => ({
          recipe_id: id,
          ingredient_name: ing.ingredient_name.trim(),
          quantity: ing.quantity ? parseFloat(ing.quantity) : null,
          unit: ing.unit.trim() || null,
          notes: ing.notes.trim() || null,
          order_index: i,
        }))
      );
    }

    setSaving(false);
    router.back();
  };

  if (loading || !initialData) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Edit Recipe' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Edit Recipe' }} />
      <RecipeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        loading={saving}
        sourceName={sourceName}
        onSourceNameChange={setSourceName}
      />
    </>
  );
}
