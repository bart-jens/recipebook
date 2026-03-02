import { supabase } from '@/lib/supabase';
import type { PublicRecipe } from '../../../shared/types/domain';

const PAGE_SIZE = 20;

const RECIPE_SELECT =
  'id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by, recipe_tags(tag)';

async function enrichRecipes(recipeData: any[]): Promise<PublicRecipe[]> {
  if (recipeData.length === 0) return [];

  const creatorIds = Array.from(new Set(recipeData.map((r) => r.created_by)));
  const recipeIds = recipeData.map((r) => r.id);

  const [{ data: profiles }, { data: ratings }] = await Promise.all([
    supabase.from('user_profiles').select('id, display_name').in('id', creatorIds),
    supabase
      .from('recipe_ratings')
      .select('recipe_id, rating')
      .in('recipe_id', recipeIds),
  ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

  const ratingMap = new Map<string, { total: number; count: number }>();
  for (const r of ratings || []) {
    const existing = ratingMap.get(r.recipe_id) || { total: 0, count: 0 };
    existing.total += r.rating;
    existing.count += 1;
    ratingMap.set(r.recipe_id, existing);
  }

  return recipeData.map((r) => {
    const ratingInfo = ratingMap.get(r.id);
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      prep_time_minutes: r.prep_time_minutes,
      cook_time_minutes: r.cook_time_minutes,
      published_at: r.published_at ?? null,
      created_by: r.created_by,
      creator_name: profileMap.get(r.created_by) || 'Unknown',
      tags: ((r as any).recipe_tags || []).map((t: { tag: string }) => t.tag),
      avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : null,
      ratingCount: ratingInfo?.count || 0,
    };
  });
}

export async function fetchDiscover(search: string): Promise<PublicRecipe[]> {
  let query = supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('visibility', 'public')
    .order('published_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data: recipeData } = await query;
  let allRecipeData = recipeData || [];

  if (search && allRecipeData.length >= 0) {
    const titleIds = new Set(allRecipeData.map((r: any) => r.id));
    const [{ data: rpcIds }, { data: tagMatches }] = await Promise.all([
      supabase.rpc('search_public_recipes_by_ingredient', { query: search }),
      supabase.from('recipe_tags').select('recipe_id').ilike('tag', `%${search}%`),
    ]);
    const extraIds = new Set<string>();
    for (const id of (rpcIds || []) as string[]) {
      if (!titleIds.has(id)) extraIds.add(id);
    }
    for (const m of tagMatches || []) {
      if (!titleIds.has(m.recipe_id)) extraIds.add(m.recipe_id);
    }
    if (extraIds.size > 0) {
      const { data: extraData } = await supabase
        .from('recipes')
        .select(RECIPE_SELECT)
        .eq('visibility', 'public')
        .in('id', Array.from(extraIds));
      allRecipeData = [...allRecipeData, ...(extraData || [])];
    }
  }

  return enrichRecipes(allRecipeData);
}

export { PAGE_SIZE, RECIPE_SELECT, enrichRecipes };
