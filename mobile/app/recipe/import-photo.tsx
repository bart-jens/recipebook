import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import RecipeForm, { RecipeFormData } from '@/components/RecipeForm';
import { colors, spacing, fontFamily } from '@/lib/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';
const MAX_SIZE = 1200;

async function resizeAndBase64(uri: string): Promise<{ base64: string; mediaType: string }> {
  // Read as blob, then convert to base64
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mediaType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
      resolve({ base64, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ImportPhotoScreen() {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<RecipeFormData | null>(null);
  const [extractedTags, setExtractedTags] = useState<string[]>([]);
  const [extractedLanguage, setExtractedLanguage] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceSkipped, setSourceSkipped] = useState(false);
  const [scanningCover, setScanningCover] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const scanBookCover = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to scan a book cover.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setScanningCover(true);
    try {
      const { base64, mediaType } = await resizeAndBase64(result.assets[0].uri);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/extract-book-cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Cookie': `sb-access-token=${session?.access_token || ''}; sb-refresh-token=${session?.refresh_token || ''}`,
        },
        body: JSON.stringify({ base64, mediaType }),
      });

      const data = await response.json();
      if (response.ok && data.title) {
        setSourceName(data.title);
        setSourceSkipped(false);
      } else {
        Alert.alert('Could not read cover', data.error || 'Try taking a clearer photo of the book title.');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to the server.');
    }
    setScanningCover(false);
  };

  const handleExtract = async () => {
    if (!imageUri) return;

    setExtracting(true);

    try {
      const { base64, mediaType } = await resizeAndBase64(imageUri);

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/extract-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Cookie': `sb-access-token=${session?.access_token || ''}; sb-refresh-token=${session?.refresh_token || ''}`,
        },
        body: JSON.stringify({ base64, mediaType }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Extraction Failed', data.error || 'Could not extract recipe from this image');
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
          ? data.ingredients.map((ing: { ingredient_name: string; quantity: number | null; unit: string; notes: string }) => ({
              ingredient_name: ing.ingredient_name || '',
              quantity: ing.quantity?.toString() || '',
              unit: ing.unit || '',
              notes: ing.notes || '',
            }))
          : [{ ingredient_name: '', quantity: '', unit: '', notes: '' }],
      });
      if (data.tags && Array.isArray(data.tags)) {
        setExtractedTags(data.tags);
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
        source_type: 'photo',
        source_name: sourceName.trim() || null,
        language: extractedLanguage,
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

    // Auto-share imported recipe (recommendation card for followers)
    await supabase.from('recipe_shares').insert({
      user_id: user.id,
      recipe_id: recipe.id,
    });

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
          headerContent={
            !sourceSkipped ? (
              <View style={styles.sourceCard}>
                <Text style={styles.sourceCardTitle}>WHERE IS THIS RECIPE FROM?</Text>

                <TouchableOpacity
                  style={[styles.scanCoverButton, scanningCover && { opacity: 0.5 }]}
                  onPress={scanBookCover}
                  disabled={scanningCover}
                  activeOpacity={0.7}
                >
                  {scanningCover ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <FontAwesome name="camera" size={16} color={colors.accent} />
                  )}
                  <Text style={styles.scanCoverText}>
                    {scanningCover ? 'Scanning...' : 'Scan book cover'}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.sourceInput}
                  value={sourceName}
                  onChangeText={setSourceName}
                  placeholder="e.g. The Food Lab, Ottolenghi Simple"
                  placeholderTextColor={colors.inkMuted}
                />

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => { setSourceSkipped(true); setSourceName(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Import from Photo' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.heading}>Scan a Recipe</Text>
        <Text style={styles.subtitle}>
          Take a photo of a recipe or choose one from your library. AI will extract the recipe details.
        </Text>

        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} contentFit="contain" />
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setImageUri(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.changeButtonText}>CHOOSE DIFFERENT IMAGE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pickContainer}>
            <TouchableOpacity style={styles.pickButton} onPress={takePhoto} activeOpacity={0.7}>
              <FontAwesome name="camera" size={28} color={colors.accent} />
              <Text style={styles.pickText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickButton} onPress={pickImage} activeOpacity={0.7}>
              <FontAwesome name="image" size={28} color={colors.accent} />
              <Text style={styles.pickText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        )}

        {imageUri && (
          <TouchableOpacity
            style={[styles.extractButton, extracting && styles.extractButtonDisabled]}
            onPress={handleExtract}
            disabled={extracting}
            activeOpacity={0.7}
          >
            {extracting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.extractButtonText}>EXTRACTING...</Text>
              </View>
            ) : (
              <Text style={styles.extractButtonText}>EXTRACT RECIPE</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>TIPS</Text>
          <Text style={styles.tipText}>Works best with clear, well-lit photos of printed or handwritten recipes.</Text>
          <Text style={styles.tipText}>Screenshots of recipe websites or apps work great too.</Text>
          <Text style={styles.tipText}>After extraction, you can review and edit all fields before saving.</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  heading: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 30, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { fontFamily: fontFamily.sans, fontSize: 14, lineHeight: 21, color: colors.inkSecondary, marginBottom: spacing.xxl },

  pickContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pickButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pickText: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },

  previewContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: 250,
    backgroundColor: colors.surfaceAlt,
  },
  changeButton: {
    marginTop: spacing.sm,
  },
  changeButtonText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.accent,
  },

  extractButton: {
    backgroundColor: colors.ink,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  extractButtonDisabled: { opacity: 0.5 },
  extractButtonText: { color: colors.white, fontFamily: fontFamily.mono, fontSize: 11, letterSpacing: 1.4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  tips: {
    marginTop: spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  tipsTitle: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 1.4, color: colors.inkSecondary, marginBottom: spacing.sm },
  tipText: { fontFamily: fontFamily.sans, fontSize: 13, color: colors.inkSecondary, marginBottom: spacing.xs },

  // Source attribution card
  sourceCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  sourceCardTitle: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.inkSecondary,
  },
  scanCoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingVertical: spacing.md,
  },
  scanCoverText: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
  },
  sourceInput: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: 10,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.ink,
  },
  skipButton: {
    paddingVertical: spacing.md,
  },
  skipText: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.inkMuted,
    textDecorationLine: 'underline' as const,
  },
});
