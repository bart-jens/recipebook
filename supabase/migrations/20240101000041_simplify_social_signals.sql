-- ============================================
-- Simplify Social Signals
--
-- Remove the "recommend" system (recipe_shares, recipe_share_cards)
-- Replace activity_feed_view: remove saved/rated events, add favorited, merge rating into cooked
-- Update get_activity_feed RPC
-- Update get_chef_profile RPC: remove recommendations
-- ============================================

-- ------------------------------------------
-- 1. Drop recommendation infrastructure
-- ------------------------------------------
-- View depends on table, drop view first
DROP VIEW IF EXISTS public.recipe_share_cards;
DROP TABLE IF EXISTS public.recipe_shares;

-- ------------------------------------------
-- 2. Replace activity_feed_view
-- ------------------------------------------
-- Event types:
--   created   — manual public recipes
--   cooked    — cook_log + LEFT JOIN recipe_ratings for inline rating
--   favorited — recipe_favorites for public recipes (NEW)
--
-- REMOVED: saved (recipe_shares dropped), rated (merged into cooked)
CREATE OR REPLACE VIEW activity_feed_view AS

-- Created events: manual recipes that are public
SELECT
  'created'::text AS event_type,
  r.created_by AS user_id,
  r.id AS recipe_id,
  r.published_at AS event_at,
  NULL::text AS notes,
  NULL::integer AS rating
FROM recipes r
WHERE r.visibility = 'public'
  AND r.published_at IS NOT NULL
  AND r.source_type = 'manual'

UNION ALL

-- Cook events: from cook_log, only for public recipes, with inline rating
SELECT
  'cooked'::text AS event_type,
  cl.user_id,
  cl.recipe_id,
  cl.cooked_at AS event_at,
  cl.notes,
  rr.rating
FROM cook_log cl
JOIN recipes r ON r.id = cl.recipe_id
LEFT JOIN recipe_ratings rr ON rr.recipe_id = cl.recipe_id AND rr.user_id = cl.user_id
WHERE r.visibility = 'public'

UNION ALL

-- Favorited events: recipe_favorites for public recipes
SELECT
  'favorited'::text AS event_type,
  rf.user_id,
  rf.recipe_id,
  rf.created_at AS event_at,
  NULL::text AS notes,
  NULL::integer AS rating
FROM recipe_favorites rf
JOIN recipes r ON r.id = rf.recipe_id
WHERE r.visibility = 'public';

-- ------------------------------------------
-- 3. Replace get_activity_feed RPC
-- ------------------------------------------
CREATE OR REPLACE FUNCTION get_activity_feed(
  p_user_id uuid,
  p_before timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  event_type text,
  user_id uuid,
  recipe_id uuid,
  event_at timestamptz,
  notes text,
  display_name text,
  avatar_url text,
  recipe_title text,
  recipe_image_url text,
  source_url text,
  source_name text,
  rating integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    af.event_type,
    af.user_id,
    af.recipe_id,
    af.event_at,
    af.notes,
    up.display_name,
    up.avatar_url,
    r.title AS recipe_title,
    r.image_url AS recipe_image_url,
    r.source_url,
    r.source_name,
    af.rating
  FROM activity_feed_view af
  JOIN user_follows uf ON uf.following_id = af.user_id AND uf.follower_id = p_user_id
  JOIN user_profiles up ON up.id = af.user_id
  JOIN recipes r ON r.id = af.recipe_id
  WHERE af.event_at < p_before
  ORDER BY af.event_at DESC
  LIMIT p_limit;
$$;

-- ------------------------------------------
-- 4. Replace get_chef_profile RPC
-- ------------------------------------------
-- Remove v_recommendations and 'recommendations' key from result
CREATE OR REPLACE FUNCTION public.get_chef_profile(p_chef_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_profile record;
  v_is_owner boolean;
  v_is_follower boolean;
  v_can_view boolean;
  v_result jsonb;
  v_stats jsonb;
  v_activity jsonb;
  v_favorites jsonb;
  v_published jsonb;
BEGIN
  -- Fetch profile
  SELECT id, display_name, bio, is_private, avatar_url
  INTO v_profile
  FROM public.user_profiles
  WHERE id = p_chef_id;

  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_is_owner := (v_caller_id = p_chef_id);

  -- Check follow status
  v_is_follower := EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE follower_id = v_caller_id AND following_id = p_chef_id
  );

  -- Can view tab data if: owner, follower, or public profile
  v_can_view := v_is_owner OR v_is_follower OR NOT v_profile.is_private;

  -- Stats
  SELECT jsonb_build_object(
    'recipe_count', (SELECT count(*) FROM public.recipes WHERE created_by = p_chef_id),
    'cook_count', (SELECT count(*) FROM public.cook_log WHERE user_id = p_chef_id),
    'follower_count', (SELECT count(*) FROM public.user_follows WHERE following_id = p_chef_id),
    'following_count', (SELECT count(*) FROM public.user_follows WHERE follower_id = p_chef_id)
  ) INTO v_stats;

  -- Tab data (only if allowed)
  IF v_can_view THEN
    -- Activity: recent cook_log entries (last 20)
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.cooked_at DESC), '[]'::jsonb)
    INTO v_activity
    FROM (
      SELECT cl.recipe_id, cl.cooked_at, cl.notes, r.title AS recipe_title, r.image_url AS recipe_image_url
      FROM public.cook_log cl
      JOIN public.recipes r ON r.id = cl.recipe_id
      WHERE cl.user_id = p_chef_id
      ORDER BY cl.cooked_at DESC
      LIMIT 20
    ) t;

    -- Favorites: recipe_favorites with rating
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.favorited_at DESC), '[]'::jsonb)
    INTO v_favorites
    FROM (
      SELECT rf.recipe_id, rf.created_at AS favorited_at,
             r.title AS recipe_title, r.image_url AS recipe_image_url,
             rr.rating
      FROM public.recipe_favorites rf
      JOIN public.recipes r ON r.id = rf.recipe_id
      LEFT JOIN public.recipe_ratings rr ON rr.recipe_id = rf.recipe_id AND rr.user_id = p_chef_id
      WHERE rf.user_id = p_chef_id
      ORDER BY rf.created_at DESC
    ) t;

    -- Published: public recipes
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.published_at DESC), '[]'::jsonb)
    INTO v_published
    FROM (
      SELECT r.id, r.title, r.description, r.image_url, r.prep_time_minutes, r.cook_time_minutes, r.published_at
      FROM public.recipes r
      WHERE r.created_by = p_chef_id AND r.visibility = 'public'
      ORDER BY r.published_at DESC
    ) t;
  ELSE
    v_activity := '[]'::jsonb;
    v_favorites := '[]'::jsonb;
    v_published := '[]'::jsonb;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'display_name', v_profile.display_name,
      'bio', v_profile.bio,
      'is_private', v_profile.is_private,
      'avatar_url', v_profile.avatar_url
    ),
    'stats', v_stats,
    'is_following', v_is_follower,
    'is_owner', v_is_owner,
    'can_view', v_can_view,
    'activity', v_activity,
    'favorites', v_favorites,
    'published', v_published
  );

  RETURN v_result;
END;
$$;
