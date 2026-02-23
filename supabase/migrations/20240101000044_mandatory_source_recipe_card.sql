-- ============================================
-- Mandatory Source + Recipe Card for Activity Feed
--
-- 1. Update activity_feed_view to exclude manual private recipes
--    (previously ALL cook/favorite events showed, including manual private)
-- 2. Add recipe_source_type to get_activity_feed RPC output
-- 3. Add get_recipe_card RPC for non-copyrightable recipe fields
-- ============================================

-- ------------------------------------------
-- 1. Replace activity_feed_view
--    Exclude manual private recipes from cook/favorite events
-- ------------------------------------------
DROP VIEW IF EXISTS public.activity_feed_view;

CREATE OR REPLACE VIEW activity_feed_view AS

-- Created events: only manual public recipes (publishing)
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

-- Cook events: exclude manual private recipes
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
WHERE r.source_type != 'manual' OR r.visibility = 'public'

UNION ALL

-- Favorited events: exclude manual private recipes
SELECT
  'favorited'::text AS event_type,
  rf.user_id,
  rf.recipe_id,
  rf.created_at AS event_at,
  NULL::text AS notes,
  NULL::integer AS rating
FROM recipe_favorites rf
JOIN recipes r ON r.id = rf.recipe_id
WHERE r.source_type != 'manual' OR r.visibility = 'public';

-- ------------------------------------------
-- 2. Replace get_activity_feed RPC
--    Add recipe_source_type to output
-- ------------------------------------------
DROP FUNCTION IF EXISTS get_activity_feed(uuid, timestamptz, int);
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
  ORDER BY af.event_at DESC
  LIMIT p_limit;
$$;

-- ------------------------------------------
-- 3. Add get_recipe_card RPC
--    Returns non-copyrightable fields only
-- ------------------------------------------
CREATE OR REPLACE FUNCTION get_recipe_card(p_recipe_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  image_url text,
  source_name text,
  source_url text,
  source_type text,
  visibility text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  tags text[],
  creator_display_name text,
  creator_avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    r.id,
    r.title,
    r.image_url,
    r.source_name,
    r.source_url,
    r.source_type::text,
    r.visibility::text,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.servings,
    COALESCE(
      (SELECT array_agg(rt.tag) FROM recipe_tags rt WHERE rt.recipe_id = r.id),
      '{}'::text[]
    ) AS tags,
    up.display_name AS creator_display_name,
    up.avatar_url AS creator_avatar_url
  FROM recipes r
  JOIN user_profiles up ON up.id = r.created_by
  WHERE r.id = p_recipe_id;
$$;
