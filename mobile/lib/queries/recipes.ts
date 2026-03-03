import { supabase } from '@/lib/supabase';
import type { RecipeListItem } from '../../../shared/types/domain';

const SELECT_FIELDS =
  'id, title, description, image_url, prep_time_minutes, cook_time_minutes, updated_at, visibility, source_type, recipe_tags(tag)';

export async function fetchRecipes(
  userId: string,
  search: string,
): Promise<RecipeListItem[]> {
  search = search.trim();
  let ownedQuery = supabase
    .from('recipes')
    .select(SELECT_FIELDS)
    .eq('created_by', userId);

  if (search) {
    ownedQuery = ownedQuery.ilike('title', `%${search}%`);
  }

  const [
    { data: ownedData },
    { data: savedEntries },
    { data: favEntries },
    { data: cookLogEntries },
  ] = await Promise.all([
    ownedQuery,
    supabase.from('saved_recipes').select('recipe_id').eq('user_id', userId),
    supabase.from('recipe_favorites').select('recipe_id').eq('user_id', userId),
    supabase.from('cook_log').select('recipe_id').eq('user_id', userId),
  ]);

  const savedRecipeIds = new Set((savedEntries || []).map((s) => s.recipe_id));
  const favoritedIds = new Set((favEntries || []).map((f) => f.recipe_id));
  const cookedIds = new Set((cookLogEntries || []).map((c) => c.recipe_id));

  // Fetch saved recipe details
  let savedRecipes: typeof ownedData = [];
  if (savedRecipeIds.size > 0) {
    let savedQuery = supabase
      .from('recipes')
      .select(SELECT_FIELDS)
      .in('id', Array.from(savedRecipeIds));
    if (search) {
      savedQuery = savedQuery.ilike('title', `%${search}%`);
    }
    const { data } = await savedQuery;
    savedRecipes = data;
  }

  const titleMatched = [...(ownedData || []), ...(savedRecipes || [])];
  const titleMatchedIds = new Set(titleMatched.map((r) => r.id));

  // When searching, also find by ingredient (FTS via RPC) or tag
  let extraRecipes: typeof titleMatched = [];
  if (search) {
    const [{ data: rpcIds }, { data: tagMatches }, { data: allOwnedIdRows }] =
      await Promise.all([
        supabase.rpc('search_recipes_by_ingredient', { query: search }),
        supabase.from('recipe_tags').select('recipe_id').ilike('tag', `%${search}%`),
        supabase.from('recipes').select('id').eq('created_by', userId),
      ]);
    const ingredientMatchIds = new Set((rpcIds || []) as string[]);
    const allOwnedIds = new Set((allOwnedIdRows || []).map((r) => r.id));
    const extraIds = new Set<string>();
    for (const id of ingredientMatchIds) {
      if (!titleMatchedIds.has(id)) extraIds.add(id);
    }
    for (const m of tagMatches || []) {
      const id = m.recipe_id;
      if (!titleMatchedIds.has(id) && (allOwnedIds.has(id) || savedRecipeIds.has(id))) {
        extraIds.add(id);
      }
    }
    if (extraIds.size > 0) {
      const { data: extraData } = await supabase
        .from('recipes')
        .select(SELECT_FIELDS)
        .in('id', Array.from(extraIds));
      extraRecipes = extraData || [];
    }
  }

  const recipeList = [...titleMatched, ...extraRecipes];

  // Batch fetch ratings
  const ratingMap = new Map<string, { total: number; count: number }>();
  if (recipeList.length > 0) {
    const { data: ratings } = await supabase
      .from('recipe_ratings')
      .select('recipe_id, rating')
      .in('recipe_id', recipeList.map((r) => r.id));

    for (const r of ratings || []) {
      const existing = ratingMap.get(r.recipe_id) || { total: 0, count: 0 };
      existing.total += r.rating;
      existing.count += 1;
      ratingMap.set(r.recipe_id, existing);
    }
  }

  return recipeList.map((r) => {
    const ratingInfo = ratingMap.get(r.id);
    return {
      ...r,
      avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : null,
      ratingCount: ratingInfo?.count || 0,
      tags: ((r as any).recipe_tags || []).map((t: { tag: string }) => t.tag),
      isFavorited: favoritedIds.has(r.id),
      hasCooked: cookedIds.has(r.id),
      isSaved: savedRecipeIds.has(r.id),
    };
  });
}
