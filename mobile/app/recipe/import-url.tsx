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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import RecipeForm, { RecipeFormData } from '@/components/RecipeForm';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

function isInstagramUrl(url: string): boolean {
  return url.includes('instagram.com/');
}

export default function ImportUrlScreen() {
  const { user } = useAuth();
  const { url: prefillUrl } = useLocalSearchParams<{ url?: string }>();
  const [url, setUrl] = useState(prefillUrl || '');
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<RecipeFormData | null>(null);
  const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(null);
  const [extractedTags, setExtractedTags] = useState<string[]>([]);
  const [extractedLanguage, setExtractedLanguage] = useState<string | null>(null);
  const [extractedSourceName, setExtractedSourceName] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'url' | 'instagram'>('url');
  const [saving, setSaving] = useState(false);

  const handleExtract = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a link');
      return;
    }

    setExtracting(true);

    const isInsta = isInstagramUrl(trimmed);
    const endpoint = isInsta ? '/api/extract-instagram' : '/api/extract-url';
    setSourceType(isInsta ? 'instagram' : 'url');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}${endpoint}`, {
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
        Alert.alert('Extraction Failed', data.error || 'Could not extract recipe from this link');
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
          ? data.ingredients.map((ing: { ingredient_name?: string; name?: string; quantity: number | null; unit: string; notes: string }) => ({
              ingredient_name: ing.ingredient_name || ing.name || '',
              quantity: ing.quantity?.toString() || '',
              unit: ing.unit || '',
              notes: ing.notes || '',
            }))
          : [{ ingredient_name: '', quantity: '', unit: '', notes: '' }],
      });

      if (data.imageUrl) {
        setExtractedImageUrl(data.imageUrl);
      }
      if (data.tags && Array.isArray(data.tags)) {
        setExtractedTags(data.tags);
      }
      if (data.source_name) {
        setExtractedSourceName(data.source_name);
      }
      if (data.language) {
        setExtractedLanguage(data.language);
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
        source_type: sourceType,
        source_url: url.trim(),
        source_name: extractedSourceName,
        language: extractedLanguage,
        image_url: extractedImageUrl,
        visibility: 'private',
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

    // Save extracted tags
    if (extractedTags.length > 0) {
      await supabase.from('recipe_tags').insert(
        extractedTags.map((tag) => ({
          recipe_id: recipe.id,
          tag: tag.toLowerCase().trim(),
        }))
      );
    }

    // Rehost external image to our own storage (fire and forget)
    if (extractedImageUrl) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        fetch(`${API_BASE}/api/rehost-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'Cookie': `sb-access-token=${session?.access_token || ''}; sb-refresh-token=${session?.refresh_token || ''}`,
          },
          body: JSON.stringify({ imageUrl: extractedImageUrl, recipeId: recipe.id }),
        });
      } catch {
        // Non-critical — external URL is already saved as fallback
      }
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
      <Stack.Screen options={{ headerTitle: 'Import from Link' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Import a Recipe</Text>
        <Text style={styles.subtitle}>
          Paste a link to any recipe website or Instagram post. We'll extract the recipe details automatically.
        </Text>

        <Text style={styles.label}>Recipe URL</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://..."
          placeholderTextColor={colors.inkMuted}
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
            <Text style={styles.buttonText}>Extract recipe</Text>
          )}
        </TouchableOpacity>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Works with</Text>
          <Text style={styles.tipText}>Recipe websites (AllRecipes, BBC Good Food, etc.)</Text>
          <Text style={styles.tipText}>Instagram posts with recipes in the caption</Text>
          <Text style={styles.tipText}>Any page with structured recipe data</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  heading: { ...typography.heading, fontSize: 28, lineHeight: 30, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { fontFamily: fontFamily.sans, fontSize: 14, lineHeight: 21, color: colors.inkSecondary, marginBottom: spacing.xxl },
  label: { ...typography.meta, color: colors.inkSecondary, marginBottom: spacing.xs },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: 12,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.ink,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...typography.metaSmall, color: colors.white },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tips: {
    marginTop: spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  tipsTitle: { ...typography.meta, color: colors.inkSecondary, marginBottom: spacing.sm },
  tipText: { fontFamily: fontFamily.sans, fontSize: 13, color: colors.inkSecondary, marginBottom: spacing.xs },
});
