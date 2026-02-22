-- Fix get_chef_profile: restore visibility-aware recipe/cook counts
--
-- Migration 000040 added proper visibility filtering to stats, but
-- migration 000041 accidentally regressed it when rewriting the RPC
-- to remove recommendations.
--
-- Also fix activity and favorites tabs to only show public recipes
-- (or the caller's own) — same regression.

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

  -- Stats: visibility-aware counts
  -- Owner sees all their own data; others see only public recipes
  SELECT jsonb_build_object(
    'recipe_count', (
      SELECT count(*) FROM public.recipes
      WHERE created_by = p_chef_id
        AND (visibility = 'public' OR created_by = v_caller_id)
    ),
    'cook_count', (
      SELECT count(*) FROM public.cook_log cl
      JOIN public.recipes r ON r.id = cl.recipe_id
      WHERE cl.user_id = p_chef_id
        AND (r.visibility = 'public' OR r.created_by = v_caller_id)
    ),
    'follower_count', (SELECT count(*) FROM public.user_follows WHERE following_id = p_chef_id),
    'following_count', (SELECT count(*) FROM public.user_follows WHERE follower_id = p_chef_id)
  ) INTO v_stats;

  -- Tab data (only if allowed)
  IF v_can_view THEN
    -- Activity: recent cook_log entries (last 20)
    -- Only show entries for public recipes or recipes the caller owns
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.cooked_at DESC), '[]'::jsonb)
    INTO v_activity
    FROM (
      SELECT cl.recipe_id, cl.cooked_at, cl.notes, r.title AS recipe_title, r.image_url AS recipe_image_url
      FROM public.cook_log cl
      JOIN public.recipes r ON r.id = cl.recipe_id
      WHERE cl.user_id = p_chef_id
        AND (r.visibility = 'public' OR r.created_by = v_caller_id)
      ORDER BY cl.cooked_at DESC
      LIMIT 20
    ) t;

    -- Favorites: recipe_favorites with rating
    -- Only show favorites for public recipes or recipes the caller owns
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
