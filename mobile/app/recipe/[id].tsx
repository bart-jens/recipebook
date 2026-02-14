import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  source_url: string | null;
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
  const [loading, setLoading] = useState(true);

  // Cooking log form state
  const [showCookForm, setShowCookForm] = useState(false);
  const [cookRating, setCookRating] = useState(0);
  const [cookNotes, setCookNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C8553D" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
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

  const renderStars = (count: number, interactive = false, onSelect?: (n: number) => void) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            disabled={!interactive}
            onPress={() => onSelect?.(n)}
            style={styles.starTouch}
          >
            <Text style={[styles.star, n <= count ? styles.starFilled : styles.starEmpty]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: recipe.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Title and favorite */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{recipe.title}</Text>
          {isOwner && (
            <TouchableOpacity onPress={toggleFavorite} style={styles.heartButton}>
              <Text style={[styles.heart, recipe.is_favorite && styles.heartActive]}>
                {recipe.is_favorite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((t) => (
              <View key={t.id} style={styles.tagPill}>
                <Text style={styles.tagText}>{t.tag}</Text>
              </View>
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
            <Text style={styles.sectionTitle}>INGREDIENTS</Text>
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
            <Text style={styles.sectionTitle}>PREPARATION</Text>
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
            <Text style={styles.sectionTitle}>COOKING LOG</Text>

            {!showCookForm ? (
              <TouchableOpacity
                style={styles.cookButton}
                onPress={() => setShowCookForm(true)}
              >
                <Text style={styles.cookButtonText}>I cooked this!</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.cookForm}>
                <Text style={styles.cookFormLabel}>How was it?</Text>
                {renderStars(cookRating, true, setCookRating)}
                <TextInput
                  style={styles.cookNotesInput}
                  placeholder="Notes (optional)"
                  placeholderTextColor="#999"
                  value={cookNotes}
                  onChangeText={setCookNotes}
                  multiline
                />
                <View style={styles.cookFormButtons}>
                  <TouchableOpacity
                    style={styles.cookCancelButton}
                    onPress={() => {
                      setShowCookForm(false);
                      setCookRating(0);
                      setCookNotes('');
                    }}
                  >
                    <Text style={styles.cookCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cookSaveButton, cookRating === 0 && styles.cookSaveDisabled]}
                    onPress={submitCookingLog}
                    disabled={cookRating === 0 || submitting}
                  >
                    <Text style={styles.cookSaveText}>
                      {submitting ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
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
                  {renderStars(entry.rating)}
                  <TouchableOpacity onPress={() => deleteCookingEntry(entry.id)}>
                    <Text style={styles.logDelete}>×</Text>
                  </TouchableOpacity>
                </View>
                {entry.notes && <Text style={styles.logNotes}>{entry.notes}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { padding: 20 },
  emptyText: { fontSize: 16, color: '#6B6B6B' },

  // Title
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', flex: 1, lineHeight: 32 },
  heartButton: { padding: 4, marginLeft: 12 },
  heart: { fontSize: 28, color: '#D1C8BC' },
  heartActive: { color: '#EF4444' },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tagPill: { backgroundColor: '#F5F0EA', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, color: '#6B6B6B' },

  // Description
  description: { fontSize: 15, color: '#6B6B6B', lineHeight: 22, marginBottom: 16 },

  // Meta
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  metaPill: { backgroundColor: '#F5F0EA', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  metaText: { fontSize: 13, color: '#6B6B6B' },
  totalPill: { backgroundColor: '#C8553D' },
  totalText: { color: '#fff' },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#6B6B6B',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE4',
    paddingBottom: 8,
  },

  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
    paddingVertical: 8,
  },
  ingredientQty: { width: 80, textAlign: 'right', fontSize: 15, fontWeight: '500', color: '#1A1A1A', marginRight: 12 },
  ingredientNameWrap: { flex: 1 },
  ingredientName: { fontSize: 15, color: '#6B6B6B' },
  ingredientNotes: { fontSize: 13, color: '#999', marginTop: 2 },

  // Instructions
  instructionText: { fontSize: 15, color: '#6B6B6B', lineHeight: 24 },
  stepRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C8553D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  stepText: { flex: 1, fontSize: 15, color: '#6B6B6B', lineHeight: 24 },

  // Cooking log
  cookButton: {
    backgroundColor: '#C8553D',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  cookButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  cookForm: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cookFormLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A', marginBottom: 8 },
  cookNotesInput: {
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 12,
  },
  cookFormButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  cookCancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cookCancelText: { fontSize: 14, color: '#6B6B6B' },
  cookSaveButton: { backgroundColor: '#C8553D', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 20 },
  cookSaveDisabled: { opacity: 0.4 },
  cookSaveText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  emptyLog: { fontSize: 14, color: '#999', fontStyle: 'italic', marginTop: 4 },

  logEntry: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0EBE4',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  logEntryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logDate: { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  logDelete: { fontSize: 22, color: '#D1C8BC', paddingHorizontal: 4 },
  logNotes: { fontSize: 13, color: '#6B6B6B', marginTop: 6, lineHeight: 18 },

  // Stars
  starsRow: { flexDirection: 'row', alignItems: 'center' },
  starTouch: { padding: 2 },
  star: { fontSize: 20 },
  starFilled: { color: '#F59E0B' },
  starEmpty: { color: '#D1C8BC' },
});
