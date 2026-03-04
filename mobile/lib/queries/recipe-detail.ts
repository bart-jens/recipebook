import { supabase } from '@/lib/supabase';

export interface RecipeData {
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

export interface IngredientData {
  id: string;
  quantity: number | null;
  unit: string | null;
  ingredient_name: string;
  notes: string | null;
  order_index: number;
}

export interface TagData {
  id: string;
  tag: string;
}

export interface RatingEntryData {
  id: string;
  rating: number;
  notes: string | null;
  cooked_date: string | null;
  created_at: string;
}

export interface CookEntryData {
  id: string;
  cooked_at: string;
  notes: string | null;
}

export interface RecipeCardData {
  id: string;
  title: string;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  source_type: string;
  visibility: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  tags: string[];
  creator_display_name: string | null;
  creator_avatar_url: string | null;
}

export interface RecipeDetailData {
  recipe: RecipeData | null;
  ingredients: IngredientData[];
  tags: TagData[];
  ratings: RatingEntryData[];
  photos: { id: string; url: string; imageType: string }[];
  creatorName: string | null;
  cookEntries: CookEntryData[];
  isFavorited: boolean;
  isSaved: boolean;
  isPrivate: boolean;
  recipeCard: RecipeCardData | null;
}

export async function fetchRecipeDetail(
  recipeId: string,
  userId: string | undefined,
): Promise<RecipeDetailData> {
  const [
    { data: recipeData },
    { data: ingredientData },
    { data: tagData },
    { data: ratingData },
    { data: imageData },
  ] = await Promise.all([
    supabase.from('recipes').select('*').eq('id', recipeId).single(),
    supabase
      .from('recipe_ingredients')
      .select('id, quantity, unit, ingredient_name, notes, order_index')
      .eq('recipe_id', recipeId)
      .order('order_index'),
    supabase.from('recipe_tags').select('id, tag').eq('recipe_id', recipeId).order('tag'),
    supabase
      .from('recipe_ratings')
      .select('id, rating, notes, cooked_date, created_at')
      .eq('recipe_id', recipeId)
      .order('cooked_date', { ascending: false }),
    supabase
      .from('recipe_images')
      .select('id, storage_path, image_type, is_primary')
      .eq('recipe_id', recipeId)
      .order('is_primary', { ascending: false })
      .order('created_at'),
  ]);

  if (!recipeData) {
    const { data: cardData } = await supabase.rpc('get_recipe_card', {
      p_recipe_id: recipeId,
    });
    const card = Array.isArray(cardData) ? cardData[0] ?? null : cardData ?? null;
    if (card && card.visibility === 'private') {
      return {
        recipe: null,
        ingredients: [],
        tags: [],
        ratings: [],
        photos: [],
        creatorName: null,
        cookEntries: [],
        isFavorited: false,
        isSaved: false,
        isPrivate: true,
        recipeCard: card as RecipeCardData,
      };
    }
    return {
      recipe: null,
      ingredients: [],
      tags: [],
      ratings: [],
      photos: [],
      creatorName: null,
      cookEntries: [],
      isFavorited: false,
      isSaved: false,
      isPrivate: false,
      recipeCard: null,
    };
  }

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

  let creatorName: string | null = null;
  if (recipeData.created_by !== userId) {
    const { data: creator } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', recipeData.created_by)
      .single();
    creatorName = creator?.display_name || null;
  }

  let cookEntries: CookEntryData[] = [];
  let isFavorited = false;
  let isSaved = false;

  if (userId) {
    const [{ data: cookData }, { data: favData }, { data: savedData }] = await Promise.all([
      supabase
        .from('cook_log')
        .select('id, cooked_at, notes')
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .order('cooked_at', { ascending: false }),
      supabase
        .from('recipe_favorites')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('saved_recipes')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);
    cookEntries = cookData || [];
    isFavorited = !!favData;
    isSaved = !!savedData;
  }

  return {
    recipe: recipeData as RecipeData,
    ingredients: ingredientData || [],
    tags: tagData || [],
    ratings: ratingData || [],
    photos: photoList,
    creatorName,
    cookEntries,
    isFavorited,
    isSaved,
    isPrivate: false,
    recipeCard: null,
  };
}
