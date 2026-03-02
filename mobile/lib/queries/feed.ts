import { supabase } from '@/lib/supabase';
import type { FeedItem } from '../../../shared/types/domain';

export interface SuggestionRecipe {
  id: string;
  title: string;
  image_url: string | null;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  recipe_tags?: { tag: string }[];
}

export interface RecentCook {
  id: string;
  cooked_at: string;
  recipes: { id: string; title: string } | null;
}

export interface FeedData {
  feedItems: FeedItem[];
  displayName: string;
  suggestions: SuggestionRecipe[];
  followingCount: number;
  recentCooks: RecentCook[];
}

const RECIPE_SELECT_FIELDS =
  'id, title, image_url, description, prep_time_minutes, cook_time_minutes, recipe_tags(tag)';

export async function fetchFeed(userId: string): Promise<FeedData> {
  const [
    { data: profile },
    { data: following },
    { data: cooks },
    { data: recent },
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single(),
    supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId),
    supabase
      .from('cook_log')
      .select('id, cooked_at, recipes(id, title)')
      .eq('user_id', userId)
      .order('cooked_at', { ascending: false })
      .limit(3),
    supabase
      .from('recipes')
      .select(RECIPE_SELECT_FIELDS)
      .eq('created_by', userId)
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  const followedIds = (following || []).map((f) => f.following_id);

  let feedItems: FeedItem[] = [];
  if (followedIds.length > 0) {
    const { data: feed } = await supabase.rpc('get_activity_feed', {
      p_user_id: userId,
      p_limit: 20,
    });
    feedItems = (feed || []) as FeedItem[];
  }

  return {
    feedItems,
    displayName: profile?.display_name || '',
    suggestions: (recent || []) as SuggestionRecipe[],
    followingCount: followedIds.length,
    recentCooks: (cooks || []) as unknown as RecentCook[],
  };
}
