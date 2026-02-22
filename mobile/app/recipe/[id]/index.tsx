import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Linking,
  Share,
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
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { uploadRecipeImage } from '@/lib/upload-image';
import { convertIngredient, type UnitSystem } from '@/lib/unit-conversion';
import { colors, spacing, typography, radii, fontFamily, animation } from '@/lib/theme';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import AnimatedHeart from '@/components/ui/AnimatedHeart';
import RecipeDetailSkeleton from '@/components/skeletons/RecipeDetailSkeleton';
import CelebrationOverlay from '@/components/ui/CelebrationOverlay';
import CollectionPicker from '@/components/ui/CollectionPicker';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


const HERO_HEIGHT = 220;
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
  forked_from_id: string | null;
  language?: string | null;
  image_url: string | null;
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

function IngredientCheckbox({ checked }: { checked: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (checked) {
      scale.value = withSpring(animation.checkPopScale, animation.springBounce);
      setTimeout(() => {
        scale.value = withSpring(1, animation.springBounce);
      }, 150);
    }
  }, [checked]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.ingCheck,
        checked && styles.ingCheckChecked,
        animStyle,
      ]}
    >
      {checked && (
        <View style={styles.ingCheckmark}>
          <FontAwesome name="check" size={9} color={colors.white} />
        </View>
      )}
    </Animated.View>
  );
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
  const [isPrivate, setIsPrivate] = useState(false);

  const [cookEntries, setCookEntries] = useState<{ id: string; cooked_at: string; notes: string | null }[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showCookForm, setShowCookForm] = useState(false);
  const [cookNotes, setCookNotes] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingNotes, setRatingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; url: string; imageType: string }[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [adjustedServings, setAdjustedServings] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const [addedIngredients, setAddedIngredients] = useState<Set<string>>(new Set());
  const [addingIngredientId, setAddingIngredientId] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem('unit_system').then((stored) => {
      if (stored === 'imperial' || stored === 'metric') setUnitSystem(stored);
    });
  }, []);

  const toggleUnitSystem = (system: UnitSystem) => {
    setUnitSystem(system);
    AsyncStorage.setItem('unit_system', system);
  };

  const toggleIngredientCheck = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const scrollY = useSharedValue(0);
  const heroScale = useSharedValue<number>(animation.imageHoverScale);

  useEffect(() => {
    heroScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, []);

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

    if (!recipeData) {
      // Check if recipe exists but is private (RLS blocked it)
      const { data: exists } = await supabase.rpc('recipe_exists', { p_recipe_id: id });
      setIsPrivate(!!exists);
      setLoading(false);
      return;
    }

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

    // Fetch user interaction data
    if (user) {
      const [{ data: cookData }, { data: favData }, { data: savedData }] = await Promise.all([
        supabase.from('cook_log').select('id, cooked_at, notes')
          .eq('recipe_id', id).eq('user_id', user.id)
          .order('cooked_at', { ascending: false }),
        supabase.from('recipe_favorites').select('id')
          .eq('recipe_id', id).eq('user_id', user.id).maybeSingle(),
        supabase.from('saved_recipes').select('id')
          .eq('recipe_id', id).eq('user_id', user.id).maybeSingle(),
      ]);
      setCookEntries(cookData || []);
      setIsFavorited(!!favData);
      setIsSaved(!!savedData);
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

  const hasCooked = cookEntries.length > 0;

  const toggleFavorite = async () => {
    if (!recipe || !user) return;
    const newVal = !isFavorited;
    setIsFavorited(newVal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newVal) {
      const { error } = await supabase.from('recipe_favorites').insert({ user_id: user.id, recipe_id: recipe.id });
      if (error) setIsFavorited(false);
    } else {
      const { error } = await supabase.from('recipe_favorites').delete().eq('user_id', user.id).eq('recipe_id', recipe.id);
      if (error) setIsFavorited(true);
    }
  };

  const toggleSave = async () => {
    if (!recipe || !user) return;
    const newVal = !isSaved;
    setIsSaved(newVal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newVal) {
      await supabase.from('saved_recipes').insert({ user_id: user.id, recipe_id: recipe.id });
    } else {
      await supabase.from('saved_recipes').delete().eq('user_id', user.id).eq('recipe_id', recipe.id);
    }
  };

  const toggleVisibility = async () => {
    if (!recipe || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newVisibility = recipe.visibility === 'public' ? 'private' : 'public';
    const updates: Record<string, unknown> = { visibility: newVisibility };
    if (newVisibility === 'public') {
      updates.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', recipe.id);

    if (!error) {
      setRecipe({ ...recipe, visibility: newVisibility });
    }
  };

  const shareLink = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        message: `${recipe.title} — https://eefeats.com/r/${recipe.id}`,
      });
    } catch {
      // User cancelled
    }
  };

  const deleteRecipe = () => {
    if (!recipe) return;
    Alert.alert('Delete Recipe', `Are you sure you want to delete "${recipe.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
          if (error) {
            Alert.alert('Error', 'Failed to delete recipe. Please try again.');
            return;
          }
          router.back();
        },
      },
    ]);
  };

  const logCookEntry = async () => {
    if (!recipe || !user) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('cook_log')
      .insert({
        user_id: user.id,
        recipe_id: recipe.id,
        cooked_at: new Date().toISOString(),
        notes: cookNotes.trim() || null,
      })
      .select()
      .single();
    if (error) {
      Alert.alert('Error', 'Could not log cook entry');
    } else if (data) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (cookEntries.length === 0) setShowCelebration(true);
      setCookEntries([data, ...cookEntries]);
      setCookNotes('');
      setShowCookForm(false);
    }
    setSubmitting(false);
  };

  const submitRating = async () => {
    if (!recipe || !user || ratingStars === 0) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('recipe_ratings')
      .insert({
        recipe_id: recipe.id,
        user_id: user.id,
        rating: ratingStars,
        notes: ratingNotes.trim() || null,
        cooked_date: null,
      })
      .select()
      .single();
    if (error) {
      Alert.alert('Error', 'Could not save rating');
    } else if (data) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRatings([data, ...ratings]);
      setRatingStars(0);
      setRatingNotes('');
      setShowRatingForm(false);
    }
    setSubmitting(false);
  };

  const deleteCookLogEntry = async (entryId: string) => {
    Alert.alert('Delete entry', 'Remove this cook log entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('cook_log').delete().eq('id', entryId);
          setCookEntries(cookEntries.filter((c) => c.id !== entryId));
        },
      },
    ]);
  };

  const deleteRatingEntry = async (entryId: string) => {
    Alert.alert('Delete entry', 'Remove this rating?', [
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
      setPhotos((prev) => [...prev, { id: Date.now().toString(), url: publicUrl, imageType: 'user_upload' }]);
    } catch {
      Alert.alert('Error', 'Could not upload image');
    }
    setUploading(false);
  };

  const addToShoppingList = async () => {
    if (!recipe || !user || ingredients.length === 0) {
      if (ingredients.length === 0) {
        Alert.alert('No ingredients', 'This recipe has no ingredients to add.');
      }
      return;
    }
    setAddingToList(true);

    // Get or create default shopping list
    let { data: list } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at')
      .limit(1)
      .maybeSingle();

    if (!list) {
      const { data: newList } = await supabase
        .from('shopping_lists')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      list = newList;
    }

    if (!list) {
      Alert.alert('Error', 'Could not create grocery list');
      setAddingToList(false);
      return;
    }

    const { error } = await supabase.rpc('add_recipe_to_shopping_list', {
      p_shopping_list_id: list.id,
      p_recipe_id: recipe.id,
    });

    setAddingToList(false);
    if (error) {
      Alert.alert('Error', 'Could not add ingredients');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddedToList(true);
      setTimeout(() => setAddedToList(false), 3000);
    }
  };

  const addSingleIngredient = async (ing: Ingredient) => {
    if (!user) return;
    setAddingIngredientId(ing.id);

    // Get or create default shopping list
    let { data: list } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at')
      .limit(1)
      .maybeSingle();

    if (!list) {
      const { data: newList } = await supabase
        .from('shopping_lists')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      list = newList;
    }

    if (!list) {
      setAddingIngredientId(null);
      return;
    }

    const { error } = await supabase
      .from('shopping_list_items')
      .insert({
        shopping_list_id: list.id,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity,
        unit: ing.unit,
      });

    setAddingIngredientId(null);
    if (!error) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAddedIngredients((prev) => new Set(prev).add(ing.id));
    }
  };

  // Parallax animated styles
  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, HERO_HEIGHT], [0, HERO_HEIGHT * 0.5], Extrapolation.CLAMP) },
      { scale: heroScale.value },
    ],
  }));

  const headerBgStyle = useAnimatedStyle(() => ({
    backgroundColor: hasImage
      ? `rgba(246, 244, 239, ${interpolate(scrollY.value, [0, HERO_HEIGHT - HEADER_HEIGHT - insets.top], [0, 0.92], Extrapolation.CLAMP)})`
      : colors.bg,
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
          {isPrivate ? (
            <>
              <Text style={styles.emptyText}>This recipe is private</Text>
              <Text style={styles.emptySubtext}>The owner hasn't made this recipe public yet.</Text>
            </>
          ) : (
            <Text style={styles.emptyText}>Recipe not found</Text>
          )}
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
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

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null;

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

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${minutes}m`;
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
          {/* Header section (below hero, overlapping gradient) */}
          <View style={[styles.detailHeader, !hasImage && { marginTop: 0 }]}>
            {/* Add photo button (no-image, owner only) */}
            {!hasImage && isOwner && (
              <TouchableOpacity
                style={styles.addImageButton}
                activeOpacity={0.7}
                onPress={pickAndUploadImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <FontAwesome name="camera" size={24} color={colors.inkMuted} />
                    <Text style={styles.addImageText}>Add a photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Mono category from first tag */}
            {tags.length > 0 && (
              <Animated.Text entering={FadeInDown.duration(300)} style={styles.detailCategory}>
                {tags[0].tag}
              </Animated.Text>
            )}

            {/* Large serif title */}
            <Animated.View entering={FadeInDown.delay(animation.staggerDelay).duration(300)} style={styles.titleRow}>
              <Text style={styles.detailTitle}>{recipe.title}</Text>
              <AnimatedHeart
                isFavorite={isFavorited}
                onToggle={toggleFavorite}
                size={24}
              />
            </Animated.View>

            {/* Light byline */}
            <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 2).duration(300)}>
              {creatorName && recipe.created_by ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(`/profile/${recipe.created_by}`)}
                >
                  <Text style={styles.detailByline}>
                    By {creatorName}
                    {cookEntries.length > 0 ? ` · Cooked ${cookEntries.length}x` : ''}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.detailByline}>
                  {isOwner ? 'By you' : ''}
                  {cookEntries.length > 0 ? `${isOwner ? ' · ' : ''}Cooked ${cookEntries.length}x` : ''}
                </Text>
              )}
            </Animated.View>

            {/* Mono date */}
            <Animated.Text entering={FadeInDown.delay(animation.staggerDelay * 2.5).duration(300)} style={styles.detailDate}>
              {recipe.source_type !== 'manual' && (recipe.source_name || recipe.source_url)
                ? `From ${recipe.source_name || (recipe.source_url ? new URL(recipe.source_url).hostname.replace(/^www\./, '') : '')}`
                : ''}
            </Animated.Text>
          </View>

          {/* Stats bar */}
          {(recipe.prep_time_minutes || recipe.cook_time_minutes || recipe.servings || avgRating) && (
            <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 3).duration(300)} style={styles.statsBar}>
              {recipe.prep_time_minutes ? (
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{formatTime(recipe.prep_time_minutes)}</Text>
                  <Text style={styles.statLabel}>Prep</Text>
                </View>
              ) : null}
              {recipe.cook_time_minutes ? (
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{formatTime(recipe.cook_time_minutes)}</Text>
                  <Text style={styles.statLabel}>Cook</Text>
                </View>
              ) : null}
              {recipe.servings != null && recipe.servings > 0 ? (
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{currentServings}</Text>
                  <Text style={styles.statLabel}>Serves</Text>
                </View>
              ) : null}
              {avgRating ? (
                <View style={[styles.statCell, styles.statCellLast]}>
                  <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              ) : null}
            </Animated.View>
          )}

          {/* Body content */}
          <View style={styles.body}>
            {/* Owner actions */}
            {isOwner && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 3.5).duration(300)} style={styles.ownerActions}>
                <Button
                  title="Edit"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push(`/recipe/${recipe.id}/edit`)}
                />
                {recipe.source_type === 'manual' && !recipe.forked_from_id && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      recipe.visibility === 'public' ? styles.publicButton : styles.privateButton,
                    ]}
                    onPress={toggleVisibility}
                  >
                    {recipe.visibility !== 'public' && (
                      <FontAwesome name="lock" size={12} color={colors.inkMuted} style={{ marginRight: spacing.xs }} />
                    )}
                    <Text style={[
                      styles.actionButtonText,
                      recipe.visibility === 'public' ? styles.publicButtonText : styles.privateButtonText,
                    ]}>
                      {recipe.visibility === 'public' ? 'Public' : 'Private'}
                    </Text>
                  </TouchableOpacity>
                )}
                {recipe.visibility === 'public' && (
                  <Button
                    title="Copy link"
                    variant="secondary"
                    size="sm"
                    onPress={shareLink}
                  />
                )}
                <Button
                  title="Delete"
                  variant="danger"
                  size="sm"
                  onPress={deleteRecipe}
                />
              </Animated.View>
            )}

            {/* Non-owner: save + share link */}
            {!isOwner && recipe.visibility === 'public' && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 3.5).duration(300)} style={styles.ownerActions}>
                <Button
                  title={isSaved ? 'Saved' : 'Save'}
                  variant={isSaved ? 'primary' : 'secondary'}
                  size="md"
                  onPress={toggleSave}
                />
                <Button
                  title="Copy link"
                  variant="secondary"
                  size="md"
                  onPress={shareLink}
                />
              </Animated.View>
            )}

            {/* Aggregate rating for public recipes */}
            {recipe.visibility === 'public' && !isOwner && ratings.length > 0 && avgRating && (
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
            )}

            {/* Tags */}
            {(tags.length > 0 || isOwner) && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 4).duration(300)} style={styles.tagsRow}>
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
                      placeholderTextColor={colors.inkMuted}
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

            {/* Add to Collection */}
            {isOwner && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 4).duration(300)}>
                <TouchableOpacity
                  style={styles.collectionButton}
                  onPress={() => setShowCollectionPicker(true)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="folder-o" size={14} color={colors.inkSecondary} />
                  <Text style={styles.collectionButtonText}>Add to Collection</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Description / intro */}
            {recipe.description && (
              <Animated.Text
                entering={FadeInDown.delay(animation.staggerDelay * 4.5).duration(300)}
                style={styles.detailIntro}
              >
                {recipe.description}
              </Animated.Text>
            )}

            {/* Source attribution for imported recipes */}
            {recipe.source_type !== 'manual' && recipe.source_url && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL(recipe.source_url!)}
                style={{ marginBottom: spacing.lg }}
              >
                <Text style={styles.sourceLink}>
                  View original recipe
                </Text>
              </TouchableOpacity>
            )}

            {/* Servings adjuster */}
            {recipe.servings != null && recipe.servings > 0 && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 5).duration(300)} style={styles.servingsAdjuster}>
                <Text style={styles.servingsLabel}>Servings</Text>
                <View style={styles.servingsControls}>
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
              </Animated.View>
            )}

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 5.5).duration(300)} style={styles.section}>
                <View style={styles.ingredientHeader}>
                  <Text style={styles.sectionLabel}>Ingredients</Text>
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
                {ingredients.map((ing, index) => {
                  const scaledQty = ing.quantity != null ? ing.quantity * scaleFactor : null;
                  const converted = convertIngredient(scaledQty, ing.unit || '', unitSystem);
                  const isChecked = checkedIngredients.has(index);
                  const isIngAdded = addedIngredients.has(ing.id) || addedToList;
                  const isIngAdding = addingIngredientId === ing.id;
                  return (
                    <Pressable
                      key={ing.id}
                      style={styles.ingredientRow}
                      onPress={() => toggleIngredientCheck(index)}
                    >
                      <IngredientCheckbox checked={isChecked} />
                      <Text style={[
                        styles.ingName,
                        isChecked && styles.ingNameChecked,
                      ]}>
                        {ing.ingredient_name}
                        {ing.notes ? ` (${ing.notes})` : ''}
                      </Text>
                      <Text style={[
                        styles.ingAmount,
                        isChecked && styles.ingAmountChecked,
                      ]}>
                        {formatQuantity(converted.quantity)} {converted.unit}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          if (!isIngAdded) addSingleIngredient(ing);
                        }}
                        disabled={isIngAdded || isIngAdding}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={[styles.ingredientAddButton, isIngAdded && styles.ingredientAddButtonDone]}
                      >
                        {isIngAdding ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <FontAwesome
                            name={isIngAdded ? 'check' : 'plus'}
                            size={10}
                            color={isIngAdded ? colors.success : colors.accent}
                          />
                        )}
                      </TouchableOpacity>
                    </Pressable>
                  );
                })}
                <TouchableOpacity
                  style={[styles.addToListButton, addedToList && styles.addToListButtonDone]}
                  onPress={addToShoppingList}
                  disabled={addingToList || addedToList}
                  activeOpacity={0.7}
                >
                  {addingToList ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <FontAwesome
                        name={addedToList ? 'check' : 'shopping-cart'}
                        size={14}
                        color={addedToList ? colors.success : colors.accent}
                      />
                      <Text style={[styles.addToListText, addedToList && styles.addToListTextDone]}>
                        {addedToList
                          ? `Added all ${ingredients.length}`
                          : 'Add all to list'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Instructions / Method */}
            {instructions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 6).duration(300)} style={styles.section}>
                <Text style={styles.sectionLabel}>Method</Text>
                {instructions.length === 1 ? (
                  <Text style={styles.stepText}>{instructions[0]}</Text>
                ) : (
                  instructions.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <Text style={styles.stepNumber}>
                        {String(i + 1).padStart(2, '0')}
                      </Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))
                )}
              </Animated.View>
            )}

            {/* Cooking Log */}
            <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 7).duration(300)} style={styles.section}>
              <Text style={styles.sectionLabel}>Cooking log</Text>

              {cookEntries.length === 0 && !showCookForm && (
                <Text style={styles.emptyLog}>You haven't cooked this yet.</Text>
              )}

              {cookEntries.map((entry) => (
                <View key={entry.id} style={styles.logEntry}>
                  <View style={styles.logEntryHeader}>
                    <Text style={styles.logDate}>
                      {new Date(entry.cooked_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <IconButton
                      name="times"
                      onPress={() => deleteCookLogEntry(entry.id)}
                      color={colors.border}
                      size={16}
                    />
                  </View>
                  {entry.notes && <Text style={styles.logNotes}>{entry.notes}</Text>}
                </View>
              ))}

              {!showCookForm ? (
                <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
                  <Button
                    title="Cooked It"
                    variant="primary"
                    size="lg"
                    onPress={() => setShowCookForm(true)}
                  />
                </View>
              ) : (
                <View style={styles.cookForm}>
                  <Text style={styles.cookFormLabel}>Notes (optional)</Text>
                  <TextInput
                    style={styles.cookNotesInput}
                    placeholder="How did it turn out?"
                    placeholderTextColor={colors.inkMuted}
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
                        setCookNotes('');
                      }}
                    />
                    <Button
                      title={submitting ? 'Logging...' : 'Log Cook'}
                      variant="primary"
                      size="sm"
                      onPress={logCookEntry}
                      disabled={submitting}
                      loading={submitting}
                    />
                  </View>
                </View>
              )}

              {/* Ratings -- gated by cooking */}
              <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Ratings</Text>
              {!hasCooked ? (
                <Text style={styles.emptyLog}>Cook this recipe to leave a rating.</Text>
              ) : (
                <>
                  {ratings.map((entry) => (
                    <View key={entry.id} style={styles.logEntry}>
                      <View style={styles.logEntryHeader}>
                        <StarRating rating={entry.rating} size={14} />
                        <IconButton
                          name="times"
                          onPress={() => deleteRatingEntry(entry.id)}
                          color={colors.border}
                          size={16}
                        />
                      </View>
                      {entry.notes && <Text style={styles.logNotes}>{entry.notes}</Text>}
                    </View>
                  ))}
                  {!showRatingForm ? (
                    <View style={{ marginTop: spacing.md }}>
                      <Button
                        title="Add rating"
                        variant="secondary"
                        size="md"
                        onPress={() => setShowRatingForm(true)}
                      />
                    </View>
                  ) : (
                    <View style={styles.cookForm}>
                      <Text style={styles.cookFormLabel}>Rating</Text>
                      <StarRating
                        rating={ratingStars}
                        size={20}
                        interactive
                        onRate={(r) => {
                          Haptics.selectionAsync();
                          setRatingStars(r);
                        }}
                      />
                      <TextInput
                        style={styles.cookNotesInput}
                        placeholder="Notes (optional)"
                        placeholderTextColor={colors.inkMuted}
                        value={ratingNotes}
                        onChangeText={setRatingNotes}
                        multiline
                      />
                      <View style={styles.cookFormButtons}>
                        <Button
                          title="Cancel"
                          variant="ghost"
                          size="sm"
                          onPress={() => {
                            setShowRatingForm(false);
                            setRatingStars(0);
                            setRatingNotes('');
                          }}
                        />
                        <Button
                          title={submitting ? 'Saving...' : 'Save Rating'}
                          variant="primary"
                          size="sm"
                          onPress={submitRating}
                          disabled={ratingStars === 0 || submitting}
                          loading={submitting}
                        />
                      </View>
                    </View>
                  )}
                </>
              )}
            </Animated.View>

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
                  <FontAwesome name="chevron-left" size={18} color={colors.accent} />
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

      {recipe && (
        <CollectionPicker
          recipeId={recipe.id}
          visible={showCollectionPicker}
          onClose={() => setShowCollectionPicker(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: spacing.xxxl },
  emptyText: { ...typography.body, color: colors.inkSecondary },
  emptySubtext: { ...typography.label, color: colors.inkSecondary, marginTop: spacing.xs, textAlign: 'center' as const },
  backLink: { marginTop: spacing.md },
  backLinkText: { ...typography.label, color: colors.accent },

  // Parallax hero
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    overflow: 'hidden',
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
    height: 80,
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
    ...typography.metaSmall,
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
    ...typography.body,
    fontFamily: fontFamily.sans,
    color: colors.ink,
    marginHorizontal: spacing.md,
  },
  headerSpacer: {
    width: 36,
  },

  // No-image: add photo
  addImageButton: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  addImageText: {
    ...typography.bodySmall,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },

  // Detail header
  detailHeader: {
    paddingHorizontal: 20,
    marginTop: -16,
    position: 'relative',
    backgroundColor: colors.bg,
  },
  detailCategory: {
    ...typography.metaSmall,
    color: colors.accent,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailTitle: {
    ...typography.title,
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  detailByline: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    marginBottom: 4,
  },
  detailDate: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginBottom: 18,
  },

  // Stats bar
  statsBar: {
    marginHorizontal: 20,
    borderTopWidth: 3,
    borderTopColor: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    flexDirection: 'row',
  },
  statCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  statCellLast: {
    borderRightWidth: 0,
  },
  statValue: {
    ...typography.subheading,
    color: colors.ink,
    lineHeight: 22,
  },
  statLabel: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginTop: 1,
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },

  // Description / intro
  detailIntro: {
    ...typography.body,
    color: colors.inkSecondary,
    marginBottom: 28,
  },

  // Source link
  sourceLink: {
    ...typography.metaSmall,
    color: colors.accent,
    textDecorationLine: 'underline',
  },

  // Creator & aggregate rating
  aggregateRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aggregateStars: {
    flexDirection: 'row',
    gap: 1,
  },
  starFilled: {
    fontSize: 15,
    color: colors.accent,
  },
  starEmpty: {
    fontSize: 15,
    color: colors.border,
  },
  aggregateText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },

  // Owner actions
  ownerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: radii.full,
    paddingVertical: spacing.sm - 1,
    paddingHorizontal: spacing.md,
  },
  actionButtonText: {
    ...typography.bodySmall,
    fontFamily: fontFamily.sans,
  },
  publicButton: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  publicButtonText: {
    color: colors.success,
    ...typography.bodySmall,
    fontFamily: fontFamily.sans,
  },
  privateButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privateButtonText: {
    color: colors.inkMuted,
    ...typography.bodySmall,
    fontFamily: fontFamily.sans,
  },
  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2, marginBottom: spacing.md, alignItems: 'center' },
  collectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  collectionButtonText: {
    ...typography.label,
    color: colors.inkSecondary,
  },
  addTagButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addTagText: {
    ...typography.metaSmall,
    color: colors.accent,
  },
  tagInputWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs - 1,
    minWidth: 80,
  },
  tagInput: {
    ...typography.metaSmall,
    color: colors.ink,
    padding: 0,
    margin: 0,
  },

  // Servings adjuster
  servingsAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  servingsLabel: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  servingsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsButtonText: {
    ...typography.body,
    fontFamily: fontFamily.sans,
    color: colors.accent,
  },
  servingsCount: {
    ...typography.subheading,
    color: colors.ink,
    minWidth: 24,
    textAlign: 'center',
  },
  servingsReset: {
    ...typography.metaSmall,
    color: colors.accent,
  },

  // Sections
  section: { marginBottom: spacing.sectionGap },

  // Section label (mono uppercase with bottom border)
  sectionLabel: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Ingredients
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.accent,
  },
  unitOptionText: {
    ...typography.metaSmall,
    color: colors.inkSecondary,
  },
  unitOptionTextActive: {
    color: colors.white,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dotted' as any,
  },
  ingCheck: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingCheckChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ingCheckmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingName: {
    flex: 1,
    ...typography.label,
    color: colors.ink,
  },
  ingNameChecked: {
    color: colors.inkMuted,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.accent,
  },
  ingAmount: {
    ...typography.meta,
    color: colors.inkSecondary,
  },
  ingAmountChecked: {
    opacity: 0.4,
  },

  // Steps / Method
  stepRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  stepNumber: {
    ...typography.heading,
    color: colors.border,
    lineHeight: 28,
    width: 36,
  },
  stepText: {
    flex: 1,
    ...typography.label,
    fontFamily: fontFamily.sansLight,
    color: colors.inkSecondary,
    lineHeight: 22,
    paddingTop: 4,
  },

  // Cooking log
  cookForm: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  } as ViewStyle,
  cookFormLabel: {
    ...typography.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  cookNotesInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.md,
    ...typography.bodySmall,
    color: colors.ink,
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
    ...typography.label,
    fontFamily: fontFamily.sansLight,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },

  logEntry: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  } as ViewStyle,
  logEntryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logDate: { ...typography.metaSmall, color: colors.ink },
  logNotes: { ...typography.bodySmall, color: colors.inkSecondary, marginTop: spacing.sm - 2, lineHeight: 18 },

  // Add to shopping list
  ingredientAddButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientAddButtonDone: {
    backgroundColor: colors.successBg,
  },
  addToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.md,
  },
  addToListButtonDone: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  addToListText: {
    ...typography.metaSmall,
    color: colors.accent,
  },
  addToListTextDone: {
    color: colors.success,
  },
});
