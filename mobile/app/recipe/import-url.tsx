import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import RecipeForm, { RecipeFormData } from '@/components/RecipeForm';
import { colors, spacing, typography, radii } from '@/lib/theme';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export default function ImportUrlScreen() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<RecipeFormData | null>(null);
  const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleExtract = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setExtracting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/extract-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Cookie': `sb-access-token=${session?.access_token || ''}; sb-refresh-token=${session?.refresh_token || ''}`,
        },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Extraction Failed', data.error || 'Could not extract recipe from this URL');
        setExtracting(false);
        return;
      }

      setExtractedData({
        title: data.title || '',
        description: data.description || '',
        instructions: data.instructions || '',
        prep_time_minutes: data.prep_time_minutes?.toString() || '',
        cook_time_minutes: data.cook_time_minutes?.toString() || '',
        servings: data.servings?.toString() || '',
        ingredients: (data.ingredients || []).length > 0
          ? data.ingredients.map((ing: { name: string; quantity: number | null; unit: string; notes: string }) => ({
              ingredient_name: ing.name || '',
              quantity: ing.quantity?.toString() || '',
              unit: ing.unit || '',
              notes: ing.notes || '',
            }))
          : [{ ingredient_name: '', quantity: '', unit: '', notes: '' }],
      });
      // Store extracted image URL for use at save time
      if (data.imageUrl) {
        setExtractedImageUrl(data.imageUrl);
      }
    } catch {
      Alert.alert('Error', 'Could not connect to the server. Please check your connection.');
    }

    setExtracting(false);
  };

  const handleSave = async (data: RecipeFormData) => {
    if (!user) return;
    setSaving(true);

    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        title: data.title.trim(),
        description: data.description.trim() || null,
        instructions: data.instructions.trim() || null,
        prep_time_minutes: data.prep_time_minutes ? parseInt(data.prep_time_minutes) : null,
        cook_time_minutes: data.cook_time_minutes ? parseInt(data.cook_time_minutes) : null,
        servings: data.servings ? parseInt(data.servings) : null,
        source_type: 'url',
        source_url: url.trim(),
        image_url: extractedImageUrl,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (error || !recipe) {
      Alert.alert('Error', 'Could not save recipe');
      setSaving(false);
      return;
    }

    const validIngredients = data.ingredients.filter((ing) => ing.ingredient_name.trim());
    if (validIngredients.length > 0) {
      await supabase.from('recipe_ingredients').insert(
        validIngredients.map((ing, i) => ({
          recipe_id: recipe.id,
          ingredient_name: ing.ingredient_name.trim(),
          quantity: ing.quantity ? parseFloat(ing.quantity) : null,
          unit: ing.unit.trim() || null,
          notes: ing.notes.trim() || null,
          order_index: i,
        }))
      );
    }

    setSaving(false);
    router.replace(`/recipe/${recipe.id}`);
  };

  if (extractedData) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Review & Save' }} />
        <RecipeForm
          initialData={extractedData}
          onSubmit={handleSave}
          submitLabel="Save Recipe"
          loading={saving}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Import from URL' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Import a Recipe</Text>
        <Text style={styles.subtitle}>
          Paste a URL from any recipe website. We'll extract the recipe details automatically.
        </Text>

        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://www.example.com/recipe/..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity
          style={[styles.button, (!url.trim() || extracting) && styles.buttonDisabled]}
          onPress={handleExtract}
          disabled={!url.trim() || extracting}
          activeOpacity={0.7}
        >
          {extracting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.buttonText}>Extracting...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Extract Recipe</Text>
          )}
        </TouchableOpacity>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <Text style={styles.tipText}>Works best with sites that use Recipe schema markup (most major recipe sites).</Text>
          <Text style={styles.tipText}>After extraction, you can review and edit all fields before saving.</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  heading: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tips: {
    marginTop: spacing.xxxl,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  tipsTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  tipText: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
});
