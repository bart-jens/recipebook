/**
 * Application-layer domain types shared between web (src/) and mobile (mobile/).
 * These sit on top of the auto-generated Supabase database.ts types.
 *
 * Import paths:
 *   Web (from src/app/*):      '../../../../shared/types/domain'
 *   Mobile (from mobile/app/*): '../../../shared/types/domain'
 */

/**
 * RecipeListItem — enriched recipe for list views on both platforms.
 * Source tables: recipes, recipe_tags, recipe_ratings, recipe_favorites, cook_log, saved_recipes
 */
export interface RecipeListItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  updated_at: string;
  visibility: string;
  source_type: 'manual' | 'url' | 'photo' | 'telegram' | 'instagram' | 'fork';
  /** Tags flattened from recipe_tags(tag) */
  tags: string[];
  /** Average of recipe_ratings.rating; null if no ratings exist */
  avgRating: number | null;
  ratingCount: number;
  /** True if the user has a recipe_favorites entry for this recipe */
  isFavorited: boolean;
  /** True if the user has any cook_log entries for this recipe */
  hasCooked: boolean;
  /** True if this recipe is in the user's saved_recipes (not owner) */
  isSaved: boolean;
}

/**
 * PublicRecipe — enriched public recipe for Discover feeds.
 * Source tables: recipes, recipe_tags, recipe_ratings, user_profiles
 */
export interface PublicRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  published_at: string | null;
  created_by: string;
  /** Display name from user_profiles */
  creator_name: string;
  /** Tags flattened from recipe_tags(tag) */
  tags: string[];
  /** Average of recipe_ratings.rating; null if no ratings exist */
  avgRating: number | null;
  ratingCount: number;
}

/**
 * ChefListItem — user card shown in chef discovery lists on both platforms.
 * Source tables: user_profiles, recipes (public count), user_follows
 */
export interface ChefListItem {
  id: string;
  display_name: string;
  avatar_url: string | null;
  recipe_count: number;
  last_cooked: string | null;
  follow_state: 'not_following' | 'following';
}

/**
 * FeedItem — activity feed event from get_activity_feed() RPC.
 * Used by: web home page, mobile home tab.
 */
export interface FeedItem {
  event_type: string;
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name: string | null;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  rating: number | null;
  recipe_visibility: string | null;
  recipe_source_type: string | null;
}
