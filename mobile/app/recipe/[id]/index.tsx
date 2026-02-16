import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ViewStyle,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  FadeInDown,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { uploadRecipeImage } from '@/lib/upload-image';
import { convertIngredient, type UnitSystem } from '@/lib/unit-conversion';
import { colors, spacing, typography, radii, fontFamily, animation } from '@/lib/theme';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import AnimatedHeart from '@/components/ui/AnimatedHeart';
import RecipeDetailSkeleton from '@/components/skeletons/RecipeDetailSkeleton';
import CelebrationOverlay from '@/components/ui/CelebrationOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(280, SCREEN_HEIGHT * 0.4);
const HEADER_HEIGHT = 56;

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  source_url: string | null;
  source_name: string | null;
  source_type: string;
  image_url: string | null;
  is_favorite: boolean;
  visibility: string;
  created_by: string;
  forked_from_id: string | null;
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
  const insets = useSafeAreaInsets();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCookForm, setShowCookForm] = useState(false);
  const [cookRating, setCookRating] = useState(0);
  const [cookNotes, setCookNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareNotes, setShareNotes] = useState<string | null>(null);
  const [publishCount, setPublishCount] = useState(0);
  const [userPlan, setUserPlan] = useState('free');
  const [photos, setPhotos] = useState<{ id: string; url: string; imageType: string }[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [adjustedServings, setAdjustedServings] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  useEffect(() => {
    AsyncStorage.getItem('unit_system').then((stored) => {
      if (stored === 'imperial' || stored === 'metric') setUnitSystem(stored);
    });
  }, []);

  const toggleUnitSystem = (system: UnitSystem) => {
    setUnitSystem(system);
    AsyncStorage.setItem('unit_system', system);
  };

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const fetchRecipe = useCallback(async () => {
    if (!id) return;

    const [{ data: recipeData }, { data: ingredientData }, { data: tagData }, { data: ratingData }, { data: imageData }] =
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
        supabase
          .from('recipe_images')
          .select('id, storage_path, image_type')
          .eq('recipe_id', id)
          .order('created_at'),
      ]);

    setRecipe(recipeData);
    setIngredients(ingredientData || []);
    setTags(tagData || []);
    setRatings(ratingData || []);

    // Build photo list: user uploads first, then source images
    const photoList = (imageData || [])
      .sort((a, b) => {
        if (a.image_type === 'user_upload' && b.image_type !== 'user_upload') return -1;
        if (a.image_type !== 'user_upload' && b.image_type === 'user_upload') return 1;
        return 0;
      })
      .map((img) => ({
        id: img.id,
        url: supabase.storage.from('recipe-images').getPublicUrl(img.storage_path).data.publicUrl,
        imageType: img.image_type,
      }));
    setPhotos(photoList);

    if (recipeData && recipeData.created_by !== user?.id) {
      const { data: creator } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', recipeData.created_by)
        .single();
      setCreatorName(creator?.display_name || null);
    }

    // Owner-specific data
    if (recipeData && recipeData.created_by === user?.id) {
      // Fetch publish count and user plan
      const [{ data: profileData }, { count }] = await Promise.all([
        supabase.from('user_profiles').select('plan').eq('id', user!.id).single(),
        supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('created_by', user!.id).eq('visibility', 'public'),
      ]);
      setUserPlan(profileData?.plan || 'free');
      setPublishCount(count || 0);

      // Check share status for imported recipes
      if (recipeData.source_type !== 'manual' && !recipeData.forked_from_id) {
        const { data: share } = await supabase
          .from('recipe_shares')
          .select('notes')
          .eq('user_id', user!.id)
          .eq('recipe_id', id)
          .maybeSingle();
        setIsShared(!!share);
        setShareNotes(share?.notes || null);
      }
    }

    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipe();
    }, [fetchRecipe])
  );

  const isOwner = user?.id === recipe?.created_by;
  const hasImage = !!recipe?.image_url;

  const toggleFavorite = async () => {
    if (!recipe || !isOwner) return;
    const newVal = !recipe.is_favorite;
    setRecipe({ ...recipe, is_favorite: newVal });
    await supabase.from('recipes').update({ is_favorite: newVal }).eq('id', recipe.id);
  };

  const publishLimit = 10;
  const atPublishLimit = userPlan === 'free' && publishCount >= publishLimit;

  const togglePublish = async () => {
    if (!recipe || !isOwner) return;
    const isPublic = recipe.visibility === 'public';

    if (!isPublic && atPublishLimit) {
      Alert.alert(
        'Publish limit reached',
        `Free accounts can publish up to ${publishLimit} recipes. Upgrade to Premium for unlimited publishing.`
      );
      return;
    }

    Alert.alert(
      isPublic ? 'Unpublish recipe?' : 'Publish recipe?',
      isPublic
        ? 'This will remove the recipe from public discovery. Continue?'
        : 'Publishing will make this recipe visible to everyone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isPublic ? 'Unpublish' : 'Publish',
          onPress: async () => {
            const newVisibility = isPublic ? 'private' : 'public';
            const update: Record<string, string | null> = { visibility: newVisibility };
            if (!isPublic) update.published_at = new Date().toISOString();
            setRecipe({ ...recipe, visibility: newVisibility });
            if (!isPublic) {
              setShowCelebration(true);
              setPublishCount((c) => c + 1);
            } else {
              setPublishCount((c) => Math.max(0, c - 1));
            }
            await supabase.from('recipes').update(update).eq('id', recipe.id);
          },
        },
      ]
    );
  };

  const forkRecipe = async () => {
    if (!recipe || !user) return;
    const { data: forked, error } = await supabase
      .from('recipes')
      .insert({
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings,
        source_type: recipe.source_type,
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

  const handleShare = () => {
    if (!recipe || !user) return;
    Alert.prompt(
      'Share this recipe',
      'Any changes you made? (optional)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async (notes?: string) => {
            const { error } = await supabase.from('recipe_shares').insert({
              user_id: user.id,
              recipe_id: recipe.id,
              notes: notes?.trim() || null,
            });
            if (error) {
              Alert.alert('Error', 'Could not share recipe');
            } else {
              setIsShared(true);
              setShareNotes(notes?.trim() || null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ],
      'plain-text',
      shareNotes || ''
    );
  };

  const handleUnshare = async () => {
    if (!recipe || !user) return;
    Alert.alert('Unshare recipe?', 'This will remove the recommendation from your followers.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unshare',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('recipe_shares').delete().eq('user_id', user.id).eq('recipe_id', recipe.id);
          setIsShared(false);
          setShareNotes(null);
        },
      },
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (ratings.length === 0) {
        setShowCelebration(true);
      }
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

  const addTag = async () => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed || !recipe) return;

    if (tags.some((t) => t.tag.toLowerCase() === trimmed)) {
      setNewTag('');
      setAddingTag(false);
      return;
    }

    const { data, error } = await supabase
      .from('recipe_tags')
      .insert({ recipe_id: recipe.id, tag: trimmed })
      .select('id, tag')
      .single();

    if (!error && data) {
      setTags([...tags, data]);
      Haptics.selectionAsync();
    }
    setNewTag('');
    setAddingTag(false);
  };

  const removeTag = async (tagId: string) => {
    await supabase.from('recipe_tags').delete().eq('id', tagId);
    setTags(tags.filter((t) => t.id !== tagId));
    Haptics.selectionAsync();
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

  // Parallax animated styles
  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, HERO_HEIGHT], [0, HERO_HEIGHT * 0.5], Extrapolation.CLAMP) }],
  }));

  const headerBgStyle = useAnimatedStyle(() => ({
    backgroundColor: hasImage
      ? `rgba(255, 251, 245, ${interpolate(scrollY.value, [0, HERO_HEIGHT - HEADER_HEIGHT - insets.top], [0, 1], Extrapolation.CLAMP)})`
      : colors.background,
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: hasImage
      ? interpolate(scrollY.value, [HERO_HEIGHT - HEADER_HEIGHT - insets.top - 20, HERO_HEIGHT - HEADER_HEIGHT - insets.top], [0, 1], Extrapolation.CLAMP)
      : 1,
  }));

  const headerBackStyle = useAnimatedStyle(() => ({
    backgroundColor: hasImage
      ? `rgba(0, 0, 0, ${interpolate(scrollY.value, [0, HERO_HEIGHT - HEADER_HEIGHT - insets.top], [0.3, 0], Extrapolation.CLAMP)})`
      : 'transparent',
  }));

  const headerIconWhiteStyle = useAnimatedStyle(() => ({
    opacity: hasImage
      ? interpolate(scrollY.value, [0, HERO_HEIGHT - HEADER_HEIGHT - insets.top], [1, 0], Extrapolation.CLAMP)
      : 0,
  }));

  const headerIconPrimaryStyle = useAnimatedStyle(() => ({
    opacity: hasImage
      ? interpolate(scrollY.value, [0, HERO_HEIGHT - HEADER_HEIGHT - insets.top], [0, 1], Extrapolation.CLAMP)
      : 1,
  }));

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <RecipeDetailSkeleton />
        </View>
      </>
    );
  }

  if (!recipe) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Recipe' }} />
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.emptyText}>Recipe not found</Text>
        </View>
      </>
    );
  }

  const instructions = recipe.instructions
    ? recipe.instructions
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  const currentServings = adjustedServings ?? recipe.servings;
  const scaleFactor = recipe.servings && currentServings ? currentServings / recipe.servings : 1;

  const formatQuantity = (qty: number | null) => {
    if (qty === null) return '';
    if (qty === Math.floor(qty)) return String(qty);
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
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Animated.ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            hasImage ? { paddingTop: HERO_HEIGHT } : { paddingTop: insets.top + HEADER_HEIGHT },
          ]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* Content */}
          <View style={styles.content}>
            {/* Add photo button (no-image, owner only) */}
            {!hasImage && isOwner && (
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
            )}

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

            {/* Aggregate rating for public recipes */}
            {recipe.visibility === 'public' && !isOwner && ratings.length > 0 && (() => {
              const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
              return (
                <View style={styles.aggregateRating}>
                  <View style={styles.aggregateStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text
                        key={star}
                        style={star <= Math.round(avgRating) ? styles.starFilled : styles.starEmpty}
                      >
                        {'\u2605'}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.aggregateText}>
                    {avgRating.toFixed(1)} ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})
                  </Text>
                </View>
              );
            })()}

            {/* Source attribution for imported recipes */}
            {recipe.source_type !== 'manual' && (recipe.source_name || recipe.source_url) && (
              <TouchableOpacity
                activeOpacity={recipe.source_url ? 0.7 : 1}
                onPress={recipe.source_url ? () => Linking.openURL(recipe.source_url!) : undefined}
                disabled={!recipe.source_url}
                style={{ marginBottom: spacing.xs }}
              >
                <Text style={recipe.source_url ? styles.sourceLink : styles.sourceText}>
                  from {recipe.source_name || (recipe.source_url ? new URL(recipe.source_url).hostname.replace(/^www\./, '') : '')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Title and favorite */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.titleRow}>
              <Text style={styles.title}>{recipe.title}</Text>
              {isOwner && (
                <AnimatedHeart
                  isFavorite={recipe.is_favorite}
                  onToggle={toggleFavorite}
                  size={24}
                />
              )}
            </Animated.View>

            {/* Owner actions */}
            {isOwner && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay).duration(300)} style={styles.ownerActions}>
                <Button
                  title="Edit"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push(`/recipe/${recipe.id}/edit`)}
                />
                {(recipe.source_type === 'manual' || recipe.forked_from_id) ? (
                  recipe.visibility === 'public' ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.publishedButton}
                      onPress={togglePublish}
                    >
                      <Text style={styles.publishedText}>Published</Text>
                    </TouchableOpacity>
                  ) : (
                    <Button
                      title={atPublishLimit ? `${publishCount}/${publishLimit}` : 'Publish'}
                      variant="secondary"
                      size="sm"
                      onPress={togglePublish}
                      disabled={atPublishLimit}
                    />
                  )
                ) : (
                  isShared ? (
                    <Button
                      title="Shared"
                      variant="secondary"
                      size="sm"
                      onPress={handleUnshare}
                    />
                  ) : (
                    <Button
                      title="Share"
                      variant="secondary"
                      size="sm"
                      onPress={handleShare}
                    />
                  )
                )}
                <Button
                  title="Delete"
                  variant="danger"
                  size="sm"
                  onPress={deleteRecipe}
                />
              </Animated.View>
            )}

            {/* Publish limit indicator for free users */}
            {isOwner && userPlan === 'free' && (recipe.source_type === 'manual' || recipe.forked_from_id) && (
              <Text style={styles.publishLimitText}>
                {publishCount}/{publishLimit} published (free plan)
              </Text>
            )}

            {/* Non-owner: fork button */}
            {!isOwner && recipe.visibility === 'public' && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay).duration(300)} style={styles.ownerActions}>
                <Button
                  title="Save to My Recipes"
                  variant="primary"
                  size="md"
                  onPress={forkRecipe}
                />
              </Animated.View>
            )}

            {/* Tags */}
            {(tags.length > 0 || isOwner) && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 2).duration(300)} style={styles.tagsRow}>
                {tags.map((t) => (
                  isOwner ? (
                    <TouchableOpacity
                      key={t.id}
                      onLongPress={() => {
                        Alert.alert('Remove tag', `Remove "${t.tag}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => removeTag(t.id) },
                        ]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Badge label={t.tag} />
                    </TouchableOpacity>
                  ) : (
                    <Badge key={t.id} label={t.tag} />
                  )
                ))}
                {isOwner && !addingTag && (
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={() => setAddingTag(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addTagText}>+ tag</Text>
                  </TouchableOpacity>
                )}
                {isOwner && addingTag && (
                  <View style={styles.tagInputWrap}>
                    <TextInput
                      style={styles.tagInput}
                      value={newTag}
                      onChangeText={setNewTag}
                      placeholder="tag name"
                      placeholderTextColor={colors.textMuted}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={addTag}
                      onBlur={() => { if (!newTag.trim()) setAddingTag(false); }}
                      autoCapitalize="none"
                    />
                  </View>
                )}
              </Animated.View>
            )}

            {/* Description */}
            {recipe.description && (
              <Animated.Text
                entering={FadeInDown.delay(animation.staggerDelay * 2).duration(300)}
                style={styles.description}
              >
                {recipe.description}
              </Animated.Text>
            )}

            {/* Time & servings pills */}
            <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 3).duration(300)} style={styles.metaRow}>
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
              {recipe.servings != null && recipe.servings > 0 && (
                <View style={styles.servingsAdjuster}>
                  <Text style={styles.metaText}>Servings:</Text>
                  <TouchableOpacity
                    onPress={() => setAdjustedServings(Math.max(1, (currentServings || 1) - 1))}
                    style={styles.servingsButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.servingsButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.servingsCount}>{currentServings}</Text>
                  <TouchableOpacity
                    onPress={() => setAdjustedServings((currentServings || 1) + 1)}
                    style={styles.servingsButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.servingsButtonText}>+</Text>
                  </TouchableOpacity>
                  {adjustedServings != null && adjustedServings !== recipe.servings && (
                    <TouchableOpacity onPress={() => setAdjustedServings(null)} activeOpacity={0.7}>
                      <Text style={styles.servingsReset}>reset</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {recipe.prep_time_minutes && recipe.cook_time_minutes && (
                <View style={[styles.metaPill, styles.totalPill]}>
                  <Text style={[styles.metaText, styles.totalText]}>
                    Total: {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 4).duration(300)} style={styles.section}>
                <View style={styles.ingredientHeader}>
                  <SectionHeader title="Ingredients" />
                  <View style={styles.unitToggle}>
                    <TouchableOpacity
                      style={[styles.unitOption, unitSystem === 'metric' && styles.unitOptionActive]}
                      onPress={() => toggleUnitSystem('metric')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.unitOptionText, unitSystem === 'metric' && styles.unitOptionTextActive]}>
                        Metric
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.unitOption, unitSystem === 'imperial' && styles.unitOptionActive]}
                      onPress={() => toggleUnitSystem('imperial')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.unitOptionText, unitSystem === 'imperial' && styles.unitOptionTextActive]}>
                        Imperial
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {ingredients.map((ing) => {
                  const scaledQty = ing.quantity != null ? ing.quantity * scaleFactor : null;
                  const converted = convertIngredient(scaledQty, ing.unit || '', unitSystem);
                  return (
                  <View key={ing.id} style={styles.ingredientRow}>
                    <Text style={styles.ingredientQty}>
                      {formatQuantity(converted.quantity)} {converted.unit}
                    </Text>
                    <View style={styles.ingredientNameWrap}>
                      <Text style={styles.ingredientName}>{ing.ingredient_name}</Text>
                      {ing.notes && <Text style={styles.ingredientNotes}>({ing.notes})</Text>}
                    </View>
                  </View>
                  );
                })}
              </Animated.View>
            )}

            {/* Instructions */}
            {instructions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 5).duration(300)} style={styles.section}>
                <SectionHeader title="Preparation" />
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
              </Animated.View>
            )}

            {/* Cooking Log */}
            {isOwner && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 6).duration(300)} style={styles.section}>
                <SectionHeader title="Cooking log" />

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
                      onRate={(r) => {
                        Haptics.selectionAsync();
                        setCookRating(r);
                      }}
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
              </Animated.View>
            )}

            <View style={{ height: spacing.xxxl + spacing.sm }} />
          </View>
        </Animated.ScrollView>

        {/* Parallax hero image / photo carousel */}
        {hasImage && (
          <Animated.View style={[styles.heroContainer, heroAnimatedStyle]}>
            {photos.length > 1 ? (
              <View style={styles.heroTouchable}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setActivePhotoIndex(index);
                  }}
                  style={StyleSheet.absoluteFill}
                >
                  {photos.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      activeOpacity={isOwner ? 0.8 : 1}
                      onPress={isOwner ? pickAndUploadImage : undefined}
                      disabled={!isOwner || uploading}
                      style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={200}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <LinearGradient
                  colors={[colors.gradientOverlayStart, colors.gradientOverlayEnd]}
                  style={styles.heroGradient}
                  pointerEvents="none"
                />
                {/* Page indicator */}
                <View style={styles.pageIndicator}>
                  <View style={styles.pageCounter}>
                    <Text style={styles.pageCounterText}>
                      {activePhotoIndex + 1} / {photos.length}
                    </Text>
                  </View>
                </View>
                {uploading && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator size="large" color={colors.white} />
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={isOwner ? 0.8 : 1}
                onPress={isOwner ? pickAndUploadImage : undefined}
                disabled={!isOwner || uploading}
                style={styles.heroTouchable}
              >
                <Image
                  source={{ uri: recipe.image_url! }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={[colors.gradientOverlayStart, colors.gradientOverlayEnd]}
                  style={styles.heroGradient}
                />
                {uploading && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator size="large" color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Celebration overlay */}
        <CelebrationOverlay
          trigger={showCelebration}
          onComplete={() => setShowCelebration(false)}
        />

        {/* Custom animated header */}
        <Animated.View style={[styles.header, { paddingTop: insets.top }, headerBgStyle]}>
          <Animated.View style={[styles.backButton, headerBackStyle]}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <View>
                <Animated.View style={headerIconPrimaryStyle}>
                  <FontAwesome name="chevron-left" size={18} color={colors.primary} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFillObject, headerIconWhiteStyle]}>
                  <FontAwesome name="chevron-left" size={18} color={colors.white} />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Animated.View>
          <Animated.Text style={[styles.headerTitle, headerTitleStyle]} numberOfLines={1}>
            {recipe.title}
          </Animated.Text>
          <View style={styles.headerSpacer} />
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: spacing.xxxl },
  content: { padding: spacing.pagePadding, backgroundColor: colors.background },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  // Parallax hero
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    zIndex: 0,
  },
  heroTouchable: {
    flex: 1,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
  pageCounter: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pageCounterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },

  // Custom header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamily.sansMedium,
    fontSize: 17,
    color: colors.text,
    marginHorizontal: spacing.md,
  },
  headerSpacer: {
    width: 36,
  },

  // No-image: add photo
  addImageButton: {
    width: '100%',
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

  // Creator & source
  creatorLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '500' },
  aggregateRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  aggregateStars: {
    flexDirection: 'row',
    gap: 1,
  },
  starFilled: {
    fontSize: 15,
    color: colors.starFilled,
  },
  starEmpty: {
    fontSize: 15,
    color: colors.border,
  },
  aggregateText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sourceLink: { ...typography.bodySmall, color: colors.primary },
  sourceText: { ...typography.bodySmall, color: colors.textSecondary },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.text,
    flex: 1,
  },

  // Owner actions
  ownerActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  publishedButton: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radii.full,
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
  publishLimitText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2, marginBottom: spacing.md, alignItems: 'center' },
  addTagButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  tagInputWrap: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs - 1,
    minWidth: 80,
  },
  tagInput: {
    ...typography.caption,
    color: colors.text,
    padding: 0,
    margin: 0,
  },

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
  servingsAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    gap: spacing.sm,
  },
  servingsButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary + '1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsButtonText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
  },
  servingsCount: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  servingsReset: {
    ...typography.caption,
    color: colors.primary,
  },

  // Sections
  section: { marginBottom: spacing.xxxl - 4 },

  // Ingredients
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  unitOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unitOptionActive: {
    backgroundColor: colors.primary,
  },
  unitOptionText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unitOptionTextActive: {
    color: colors.white,
  },
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  } as ViewStyle,
  cookFormLabel: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cookNotesInput: {
    backgroundColor: colors.card,
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  } as ViewStyle,
  logEntryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logDate: { ...typography.label, color: colors.text },
  logNotes: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm - 2, lineHeight: 18 },
});
