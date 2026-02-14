import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { uploadRecipeImage } from '@/lib/upload-image';
import { colors, spacing, typography, radii, shadows } from '@/lib/theme';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  source_url: string | null;
  image_url: string | null;
  is_favorite: boolean;
  visibility: string;
  created_by: string;
}

interface Ingredient {
  id: string;
  quantity: number | null;
  unit: string | null;
  ingredient_name: string;
  notes: string | null;
  order_index: number;
}

interface Tag {
  id: string;
  tag: string;
}

interface RatingEntry {
  id: string;
  rating: number;
  notes: string | null;
  cooked_date: string | null;
  created_at: string;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cooking log form state
  const [showCookForm, setShowCookForm] = useState(false);
  const [cookRating, setCookRating] = useState(0);
  const [cookNotes, setCookNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchRecipe = useCallback(async () => {
    if (!id) return;

    const [{ data: recipeData }, { data: ingredientData }, { data: tagData }, { data: ratingData }] =
      await Promise.all([
        supabase.from('recipes').select('*').eq('id', id).single(),
        supabase
          .from('recipe_ingredients')
          .select('id, quantity, unit, ingredient_name, notes, order_index')
          .eq('recipe_id', id)
          .order('order_index'),
        supabase.from('recipe_tags').select('id, tag').eq('recipe_id', id).order('tag'),
        supabase
          .from('recipe_ratings')
          .select('id, rating, notes, cooked_date, created_at')
          .eq('recipe_id', id)
          .order('cooked_date', { ascending: false }),
      ]);

    setRecipe(recipeData);
    setIngredients(ingredientData || []);
    setTags(tagData || []);
    setRatings(ratingData || []);

    // Fetch creator name for non-owned public recipes
    if (recipeData && recipeData.created_by !== user?.id) {
      const { data: creator } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', recipeData.created_by)
        .single();
      setCreatorName(creator?.display_name || null);
    }

    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipe();
    }, [fetchRecipe])
  );

  const isOwner = user?.id === recipe?.created_by;

  const toggleFavorite = async () => {
    if (!recipe || !isOwner) return;
    const newVal = !recipe.is_favorite;
    setRecipe({ ...recipe, is_favorite: newVal });
    await supabase.from('recipes').update({ is_favorite: newVal }).eq('id', recipe.id);
  };

  const togglePublish = async () => {
    if (!recipe || !isOwner) return;
    const isPublic = recipe.visibility === 'public';
    const newVisibility = isPublic ? 'private' : 'public';
    const update: Record<string, string | null> = { visibility: newVisibility };
    if (!isPublic) update.published_at = new Date().toISOString();
    setRecipe({ ...recipe, visibility: newVisibility });
    await supabase.from('recipes').update(update).eq('id', recipe.id);
  };

  const forkRecipe = async () => {
    if (!recipe || !user) return;
    // Copy recipe + ingredients
    const { data: forked, error } = await supabase
      .from('recipes')
      .insert({
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings,
        source_type: 'fork',
        source_url: recipe.source_url,
        forked_from_id: recipe.id,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (error || !forked) {
      Alert.alert('Error', 'Could not fork recipe');
      return;
    }

    // Copy ingredients
    if (ingredients.length > 0) {
      await supabase.from('recipe_ingredients').insert(
        ingredients.map((ing, i) => ({
          recipe_id: forked.id,
          ingredient_name: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          order_index: i,
        }))
      );
    }

    // Copy tags
    if (tags.length > 0) {
      await supabase.from('recipe_tags').insert(
        tags.map((t) => ({ recipe_id: forked.id, tag: t.tag }))
      );
    }

    Alert.alert('Saved!', 'Recipe saved to your collection', [
      { text: 'View', onPress: () => router.replace(`/recipe/${forked.id}`) },
      { text: 'OK' },
    ]);
  };

  const deleteRecipe = () => {
    if (!recipe) return;
    Alert.alert('Delete Recipe', `Are you sure you want to delete "${recipe.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipe.id);
          await supabase.from('recipe_tags').delete().eq('recipe_id', recipe.id);
          await supabase.from('recipe_ratings').delete().eq('recipe_id', recipe.id);
          await supabase.from('recipes').delete().eq('id', recipe.id);
          router.back();
        },
      },
    ]);
  };

  const submitCookingLog = async () => {
    if (!recipe || cookRating === 0) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from('recipe_ratings')
      .insert({
        recipe_id: recipe.id,
        user_id: user!.id,
        rating: cookRating,
        notes: cookNotes.trim() || null,
        cooked_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      Alert.alert('Error', 'Could not save cooking log');
    } else if (data) {
      setRatings([data, ...ratings]);
      setCookRating(0);
      setCookNotes('');
      setShowCookForm(false);
    }
    setSubmitting(false);
  };

  const deleteCookingEntry = async (entryId: string) => {
    Alert.alert('Delete entry', 'Remove this cooking log entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('recipe_ratings').delete().eq('id', entryId);
          setRatings(ratings.filter((r) => r.id !== entryId));
        },
      },
    ]);
  };

  const pickAndUploadImage = async () => {
    if (!recipe || !user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const publicUrl = await uploadRecipeImage(user.id, recipe.id, result.assets[0].uri);
      setRecipe({ ...recipe, image_url: publicUrl });
    } catch {
      Alert.alert('Error', 'Could not upload image');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Recipe not found</Text>
      </View>
    );
  }

  const instructions = recipe.instructions
    ? recipe.instructions
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  const formatQuantity = (qty: number | null) => {
    if (qty === null) return '';
    if (qty === Math.floor(qty)) return String(qty);
    // Common fractions
    const frac = qty - Math.floor(qty);
    const whole = Math.floor(qty);
    const fractions: Record<string, string> = {
      '0.25': '\u00BC',
      '0.33': '\u2153',
      '0.5': '\u00BD',
      '0.67': '\u2154',
      '0.75': '\u00BE',
    };
    const key = frac.toFixed(2);
    if (fractions[key]) {
      return whole > 0 ? `${whole}${fractions[key]}` : fractions[key];
    }
    return qty.toFixed(1);
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: recipe.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero image */}
        {recipe.image_url ? (
          <TouchableOpacity
            activeOpacity={isOwner ? 0.8 : 1}
            onPress={isOwner ? pickAndUploadImage : undefined}
            disabled={!isOwner || uploading}
          >
            <Image
              source={{ uri: recipe.image_url }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
        ) : isOwner ? (
          <TouchableOpacity
            style={styles.addImageButton}
            activeOpacity={0.7}
            onPress={pickAndUploadImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <FontAwesome name="camera" size={24} color={colors.textMuted} />
                <Text style={styles.addImageText}>Add a photo</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}

        {/* Creator name for non-owned recipes */}
        {creatorName && recipe.created_by && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/profile/${recipe.created_by}`)}
            style={{ marginBottom: spacing.xs }}
          >
            <Text style={styles.creatorLink}>by {creatorName}</Text>
          </TouchableOpacity>
        )}

        {/* Title and favorite */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{recipe.title}</Text>
          {isOwner && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleFavorite}
              style={styles.heartButton}
            >
              <FontAwesome
                name={recipe.is_favorite ? 'heart' : 'heart-o'}
                size={24}
                color={recipe.is_favorite ? colors.dangerLight : colors.starEmpty}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Owner actions */}
        {isOwner && (
          <View style={styles.ownerActions}>
            <Button
              title="Edit"
              variant="secondary"
              size="sm"
              onPress={() => router.push(`/recipe/${recipe.id}/edit`)}
            />
            {recipe.visibility === 'public' ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.publishedButton}
                onPress={togglePublish}
              >
                <Text style={styles.publishedText}>Published</Text>
              </TouchableOpacity>
            ) : (
              <Button
                title="Publish"
                variant="secondary"
                size="sm"
                onPress={togglePublish}
              />
            )}
            <Button
              title="Delete"
              variant="danger"
              size="sm"
              onPress={deleteRecipe}
            />
          </View>
        )}

        {/* Non-owner: fork button */}
        {!isOwner && recipe.visibility === 'public' && (
          <View style={styles.ownerActions}>
            <Button
              title="Save to My Recipes"
              variant="primary"
              size="md"
              onPress={forkRecipe}
            />
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((t) => (
              <Badge key={t.id} label={t.tag} />
            ))}
          </View>
        )}

        {/* Description */}
        {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

        {/* Time & servings pills */}
        <View style={styles.metaRow}>
          {recipe.prep_time_minutes && (
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Prep: {recipe.prep_time_minutes} min</Text>
            </View>
          )}
          {recipe.cook_time_minutes && (
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Cook: {recipe.cook_time_minutes} min</Text>
            </View>
          )}
          {recipe.servings && (
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Servings: {recipe.servings}</Text>
            </View>
          )}
          {recipe.prep_time_minutes && recipe.cook_time_minutes && (
            <View style={[styles.metaPill, styles.totalPill]}>
              <Text style={[styles.metaText, styles.totalText]}>
                Total: {recipe.prep_time_minutes + recipe.cook_time_minutes} min
              </Text>
            </View>
          )}
        </View>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="INGREDIENTS" />
            {ingredients.map((ing) => (
              <View key={ing.id} style={styles.ingredientRow}>
                <Text style={styles.ingredientQty}>
                  {formatQuantity(ing.quantity)} {ing.unit || ''}
                </Text>
                <View style={styles.ingredientNameWrap}>
                  <Text style={styles.ingredientName}>{ing.ingredient_name}</Text>
                  {ing.notes && <Text style={styles.ingredientNotes}>({ing.notes})</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        {instructions.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="PREPARATION" />
            {instructions.length === 1 ? (
              <Text style={styles.instructionText}>{instructions[0]}</Text>
            ) : (
              instructions.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Cooking Log */}
        {isOwner && (
          <View style={styles.section}>
            <SectionHeader title="COOKING LOG" />

            {!showCookForm ? (
              <View style={{ marginBottom: spacing.lg }}>
                <Button
                  title="I cooked this!"
                  variant="primary"
                  size="lg"
                  onPress={() => setShowCookForm(true)}
                />
              </View>
            ) : (
              <View style={styles.cookForm}>
                <Text style={styles.cookFormLabel}>How was it?</Text>
                <StarRating
                  rating={cookRating}
                  size={20}
                  interactive
                  onRate={setCookRating}
                />
                <TextInput
                  style={styles.cookNotesInput}
                  placeholder="Notes (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={cookNotes}
                  onChangeText={setCookNotes}
                  multiline
                />
                <View style={styles.cookFormButtons}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setShowCookForm(false);
                      setCookRating(0);
                      setCookNotes('');
                    }}
                  />
                  <Button
                    title={submitting ? 'Saving...' : 'Save'}
                    variant="primary"
                    size="sm"
                    onPress={submitCookingLog}
                    disabled={cookRating === 0 || submitting}
                    loading={submitting}
                  />
                </View>
              </View>
            )}

            {ratings.length === 0 && !showCookForm && (
              <Text style={styles.emptyLog}>You haven't cooked this yet.</Text>
            )}

            {ratings.map((entry) => (
              <View key={entry.id} style={styles.logEntry}>
                <View style={styles.logEntryHeader}>
                  <Text style={styles.logDate}>
                    {entry.cooked_date
                      ? new Date(entry.cooked_date + 'T00:00:00').toLocaleDateString()
                      : 'No date'}
                  </Text>
                  <StarRating rating={entry.rating} size={14} />
                  <IconButton
                    name="times"
                    onPress={() => deleteCookingEntry(entry.id)}
                    color={colors.starEmpty}
                    size={16}
                  />
                </View>
                {entry.notes && <Text style={styles.logNotes}>{entry.notes}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xxxl + spacing.sm }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.xl },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  // Hero image
  heroImage: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    aspectRatio: 16 / 9,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    aspectRatio: 16 / 9,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  addImageText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Creator
  creatorLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '500' },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.text, flex: 1 },
  heartButton: { padding: spacing.xs, marginLeft: spacing.md },

  // Owner actions
  ownerActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  publishedButton: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radii.md,
    paddingVertical: spacing.sm - 1,
    paddingHorizontal: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  publishedText: {
    ...typography.label,
    color: colors.success,
    fontWeight: '600',
  },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2, marginBottom: spacing.md },

  // Description
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },

  // Meta
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl },
  metaPill: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  metaText: { ...typography.label, color: colors.textSecondary },
  totalPill: { backgroundColor: colors.primary },
  totalText: { color: colors.white },

  // Sections
  section: { marginBottom: spacing.xxxl - 4 },

  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  ingredientQty: {
    width: 80,
    textAlign: 'right',
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    marginRight: spacing.md,
  },
  ingredientNameWrap: { flex: 1 },
  ingredientName: { ...typography.body, color: colors.textSecondary },
  ingredientNotes: { ...typography.label, color: colors.textMuted, marginTop: 2 },

  // Instructions
  instructionText: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  stepRow: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.md },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: { color: colors.white, ...typography.label, fontWeight: '600' },
  stepText: { flex: 1, ...typography.body, color: colors.textSecondary, lineHeight: 24 },

  // Cooking log
  cookForm: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows,
  } as ViewStyle,
  cookFormLabel: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cookNotesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    ...typography.bodySmall,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: spacing.md,
  },
  cookFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },

  emptyLog: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  logEntry: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadows,
  } as ViewStyle,
  logEntryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logDate: { ...typography.label, color: colors.text },
  logNotes: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm - 2, lineHeight: 18 },
});
