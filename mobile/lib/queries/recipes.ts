import { supabase } from '@/lib/supabase';
import type { RecipeListItem } from '../../../shared/types/domain';

const SELECT_FIELDS =
  'id, title, description, image_url, prep_time_minutes, cook_time_minutes, updated_at, visibility, source_type, recipe_tags(tag)';

// Load all user recipes with no search filter.
// Called once on mount; cached for 2 min. Title search is done client-side.
export async function fetchAllUserRecipes(userId: string): Promise<RecipeListItem[]> {
  const [
    { data: ownedData },
    { data: savedEntries },
    { data: favEntries },
    { data: cookLogEntries },
  ] = await Promise.all([
    supabase.from('recipes').select(SELECT_FIELDS).eq('created_by', userId),
    supabase.from('saved_recipes').select('recipe_id').eq('user_id', userId),
    supabase.from('recipe_favorites').select('recipe_id').eq('user_id', userId),
    supabase.from('cook_log').select('recipe_id').eq('user_id', userId),
  ]);

  const savedRecipeIds = new Set((savedEntries || []).map((s) => s.recipe_id));
  const favoritedIds = new Set((favEntries || []).map((f) => f.recipe_id));
  const cookedIds = new Set((cookLogEntries || []).map((c) => c.recipe_id));

  let savedRecipes: typeof ownedData = [];
  if (savedRecipeIds.size > 0) {
    const { data } = await supabase
      .from('recipes')
      .select(SELECT_FIELDS)
      .in('id', Array.from(savedRecipeIds));
    savedRecipes = data;
  }

  const recipeList = [...(ownedData || []), ...(savedRecipes || [])];

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

// Returns IDs of recipes that match by ingredient or tag.
// Runs after debounce; results merged into client-side-filtered list.
export async function fetchIngredientMatchIds(userId: string, search: string): Promise<string[]> {
  search = search.trim();
  if (!search) return [];

  const [{ data: rpcIds }, { data: tagMatches }] = await Promise.all([
    supabase.rpc('search_recipes_by_ingredient', { query: search }),
    supabase.from('recipe_tags').select('recipe_id').ilike('tag', `%${search}%`),
  ]);

  const matchedIds = new Set<string>();
  for (const id of (rpcIds || []) as string[]) {
    matchedIds.add(id);
  }
  for (const m of tagMatches || []) {
    matchedIds.add(m.recipe_id);
  }
  return Array.from(matchedIds);
}
