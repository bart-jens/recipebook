-- Update get_chef_profile: show all cook activity (not just public recipes)
-- and include source fields so frontend can render attribution.
--
-- Update get_activity_feed: add recipe_source_type to return so frontend
-- can distinguish cookbook imports from URL imports.

-- ============================================================
-- 1. get_chef_profile — remove visibility filter from activity
-- ============================================================

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
    'recipe_count', (
      SELECT count(*) FROM public.recipes
      WHERE created_by = p_chef_id
        AND (visibility = 'public' OR created_by = v_caller_id)
    ),
    'cook_count', (
      SELECT count(DISTINCT cl.recipe_id) FROM public.cook_log cl
      WHERE cl.user_id = p_chef_id
    ),
    'follower_count', (SELECT count(*) FROM public.user_follows WHERE following_id = p_chef_id),
    'following_count', (SELECT count(*) FROM public.user_follows WHERE follower_id = p_chef_id)
  ) INTO v_stats;

  -- Tab data (only if allowed)
  IF v_can_view THEN
    -- Activity: ALL cook_log entries, with source fields for attribution.
    -- Private recipe titles are safe to expose (not copyrightable).
    -- Frontend uses source_url + source_type to decide how to link.
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.cooked_at DESC), '[]'::jsonb)
    INTO v_activity
    FROM (
      SELECT
        cl.recipe_id,
        cl.cooked_at,
        cl.notes,
        r.title AS recipe_title,
        r.image_url AS recipe_image_url,
        r.source_url,
        r.source_name,
        r.source_type,
        r.visibility AS recipe_visibility
      FROM public.cook_log cl
      JOIN public.recipes r ON r.id = cl.recipe_id
      WHERE cl.user_id = p_chef_id
      ORDER BY cl.cooked_at DESC
      LIMIT 20
    ) t;

    -- Favorites: public recipes only (private recipe titles not shown in others' favorites)
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
        AND (r.visibility = 'public' OR r.created_by = v_caller_id)
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

-- ============================================================
-- 2. get_activity_feed — add recipe_source_type to return
-- Must DROP first because we're changing the return type.
-- ============================================================

DROP FUNCTION IF EXISTS public.get_activity_feed(uuid, timestamptz, int);

CREATE FUNCTION public.get_activity_feed(
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
  rating integer,
  recipe_visibility text,
  recipe_source_type text
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
    af.rating,
    r.visibility::text AS recipe_visibility,
    r.source_type::text AS recipe_source_type
  FROM activity_feed_view af
  JOIN user_follows uf ON uf.following_id = af.user_id AND uf.follower_id = p_user_id
  JOIN user_profiles up ON up.id = af.user_id
  JOIN recipes r ON r.id = af.recipe_id
  WHERE af.event_at < p_before
    AND up.is_hidden IS NOT TRUE
  ORDER BY af.event_at DESC
  LIMIT p_limit;
$$;
